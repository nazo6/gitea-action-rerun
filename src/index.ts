import * as core from "@actions/core";
import { load } from "cheerio";

main();

async function main() {
  const gitea_awesome = core.getInput("gitea_awesome", { required: true });
  const gitea_incredible = core.getInput("gitea_incredible", {
    required: true,
  });
  const gitea_instance = core.getInput("gitea_instance", { required: true });
  const gitea_repo = core.getInput("gitea_repo", { required: true });
  const workflow_file = core.getInput("workflow_file", { required: true });
  await rerun(
    { gitea_awesome, gitea_incredible },
    gitea_instance,
    gitea_repo,
    workflow_file,
  );
}

function cookieToString(cookie: Record<string, string>) {
  return Object.entries(cookie)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function parseSetCookie(cookie: string[]): Record<string, string> {
  return Object.fromEntries(cookie.map((c) => c.split(";")[0].split("=")));
}

async function login(
  gitea_awesome: string,
  gitea_incredible: string,
  gitea_instance: string,
) {
  const cookie: Record<string, string> = { gitea_awesome, gitea_incredible };

  const page_res = await fetch(gitea_instance, {
    headers: { Cookie: cookieToString(cookie) },
    redirect: "manual",
  });
  const i_like_gitea = parseSetCookie(
    page_res.headers.getSetCookie()!,
  ).i_like_gitea;
  if (!i_like_gitea) {
    throw Error("No i_like_gitea returned");
  }
  cookie.i_like_gitea = i_like_gitea;

  const LOGIN_PAGE_URL = `${gitea_instance}/user/login`;
  const login_page_res = await fetch(LOGIN_PAGE_URL, {
    headers: { Cookie: cookieToString(cookie) },
    redirect: "manual",
  });
  const login_cookie = parseSetCookie(login_page_res.headers.getSetCookie());

  if (!login_cookie.i_like_gitea) {
    console.log(login_cookie);
    throw Error("No login cookie returned");
  }

  return login_cookie.i_like_gitea;
}

async function rerun(
  auth: { gitea_awesome: string; gitea_incredible: string },
  gitea_instance: string,
  gitea_repo: string,
  workflow_file: string,
) {
  const i_like_gitea = await login(
    auth.gitea_awesome,
    auth.gitea_incredible,
    gitea_instance,
  );
  const cookie: Record<string, string> = {
    gitea_awesome: auth.gitea_awesome,
    gitea_incredible: auth.gitea_incredible,
    i_like_gitea,
  };

  const RUN_LIST_PAGE_URL =
    `${gitea_instance}/${gitea_repo}/actions?workflow=${workflow_file}`;

  console.log("Fetching run url from workflow page: ", RUN_LIST_PAGE_URL);

  const run_list_page_res = await fetch(RUN_LIST_PAGE_URL, {
    headers: {
      Cookie: cookieToString(cookie),
    },
  });
  if (!run_list_page_res.ok) {
    throw Error(
      `Failed to fetch ${RUN_LIST_PAGE_URL}: ${run_list_page_res.status} ${run_list_page_res.statusText}`,
    );
  }
  const csrf_token = parseSetCookie(
    run_list_page_res.headers.getSetCookie(),
  )._csrf;
  if (!csrf_token) {
    throw Error("No csrf_token returned");
  }
  cookie._csrf = csrf_token;

  const $ = load(await run_list_page_res.text());
  const RUN_PAGE_URL = $(
    ".issue.list li:first-of-type .issue-item-top-row a",
  ).attr("href");
  if (!RUN_PAGE_URL) {
    throw new Error("No run found");
  }

  const RERUN_HOOK_URL = `${gitea_instance}${RUN_PAGE_URL}/rerun`;

  console.log(`Triggering rerun: ${RERUN_HOOK_URL}`);

  const rerun_hook_res = await fetch(RERUN_HOOK_URL, {
    method: "POST",
    headers: {
      Cookie: cookieToString(cookie),
      "X-Csrf-Token": csrf_token,
    },
  });
  if (!rerun_hook_res.ok) {
    throw Error(
      `Failed to trigger rerun: ${rerun_hook_res.status} ${rerun_hook_res.statusText}`,
    );
  }
  const text = await rerun_hook_res.text();
  if (text.trim() != "{}") {
    console.log(text);
    throw Error(`Failed to trigger rerun!`);
  }

  console.log("Success!");
}
