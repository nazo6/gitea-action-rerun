import * as core from "@actions/core";
import { login, login_by_pass } from "./login";
import { rerun } from "./rerun";

main();

async function main() {
  const gitea_awesome = core.getInput("gitea_awesome", { required: false });
  const gitea_incredible = core.getInput("gitea_incredible", {
    required: false,
  });

  const gitea_username = core.getInput("gitea_username", { required: false });
  const gitea_password = core.getInput("gitea_password", {
    required: false,
  });

  const gitea_instance = core.getInput("gitea_instance", { required: true });
  const gitea_repo = core.getInput("gitea_repo", { required: true });
  const workflow_file = core.getInput("workflow_file", { required: true });

  let auth;
  if (gitea_awesome !== "" && gitea_incredible !== "") {
    auth = await login(gitea_awesome, gitea_incredible, gitea_instance);
  } else if (gitea_username !== "" && gitea_password !== "") {
    auth = await login_by_pass(gitea_username, gitea_password, gitea_instance);
  } else {
    throw Error("No valid auth info provided");
  }

  await rerun(
    auth,
    gitea_instance,
    gitea_repo,
    workflow_file,
  );
}
