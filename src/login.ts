import { AuthInfo, cookieToString, parseSetCookie } from "./utils";

export async function login_by_pass(
  username: string,
  password: string,
  gitea_instance: string,
): Promise<AuthInfo> {
  const LOGIN_PAGE_URL = `${gitea_instance}/user/login`;

  const page_res = await fetch(gitea_instance, {
    redirect: "manual",
  });
  await page_res.text();
  const temp_cookies = parseSetCookie(page_res.headers.getSetCookie());
  const i_like_gitea = temp_cookies.i_like_gitea;
  const csrf_token = temp_cookies._csrf;
  if (!i_like_gitea || !csrf_token) {
    throw Error("Valid cookie is not returned");
  }

  const login_res = await fetch(LOGIN_PAGE_URL, {
    headers: { Cookie: cookieToString(temp_cookies) },
    redirect: "manual",
    method: "POST",
    body: new URLSearchParams({
      user_name: username,
      password,
      _csrf: csrf_token,
    }),
  });
  await login_res.text();
  const login_cookie = parseSetCookie(login_res.headers.getSetCookie());

  if (
    !login_cookie.i_like_gitea
  ) {
    console.log(login_cookie);
    throw Error("Failed to login");
  }

  return {
    i_like_gitea: login_cookie.i_like_gitea,
  };
}

export async function login(
  gitea_awesome: string,
  gitea_incredible: string,
  gitea_instance: string,
): Promise<AuthInfo> {
  const cookie: Record<string, string> = { gitea_awesome, gitea_incredible };

  const page_res = await fetch(gitea_instance, {
    headers: { Cookie: cookieToString(cookie) },
    redirect: "manual",
  });
  await page_res.text();
  const i_like_gitea =
    parseSetCookie(page_res.headers.getSetCookie()!).i_like_gitea;
  if (!i_like_gitea) {
    throw Error("No i_like_gitea returned");
  }
  cookie.i_like_gitea = i_like_gitea;

  const LOGIN_PAGE_URL = `${gitea_instance}/user/login`;
  const login_page_res = await fetch(LOGIN_PAGE_URL, {
    headers: { Cookie: cookieToString(cookie) },
    redirect: "manual",
  });
  await login_page_res.text();
  const login_cookie = parseSetCookie(login_page_res.headers.getSetCookie());

  if (!login_cookie.i_like_gitea) {
    console.log(login_cookie);
    throw Error("No login cookie returned");
  }

  return {
    i_like_gitea: login_cookie.i_like_gitea,
  };
}
