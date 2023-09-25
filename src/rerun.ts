import * as cheerio from "cheerio";
import { AuthInfo, cookieToString, parseSetCookie } from "./utils";

export async function rerun(
  auth: AuthInfo,
  gitea_instance: string,
  gitea_repo: string,
  workflow_file: string,
) {
  const cookie: Record<string, string> = {
    i_like_gitea: auth.i_like_gitea,
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
  const csrf_token =
    parseSetCookie(run_list_page_res.headers.getSetCookie())._csrf;
  if (!csrf_token) {
    throw Error("No csrf_token returned");
  }
  cookie._csrf = csrf_token;

  const $ = cheerio.load(await run_list_page_res.text());
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
  const text = await rerun_hook_res.text();
  if (!rerun_hook_res.ok) {
    throw Error(
      `Failed to trigger rerun: ${rerun_hook_res.status} ${rerun_hook_res.statusText}`,
    );
  }
  if (text.trim() != "{}") {
    console.log(text);
    throw Error(
      `Failed to trigger rerun!`,
    );
  }

  console.log("Success!");
}
