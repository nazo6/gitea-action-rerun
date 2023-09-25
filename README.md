# gitea-action-rerun Action

Action to rerun gitea action.

## Usage

Here is example workflow.

```yaml:.gitea/workflows/action.yml
name: Deploy other repo

on:
  push:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger rerun
        uses: https://github.com/nazo6/gitea-action-rerun@master
        with:
          gitea_awesome: ${{ secrets.COOKIE_GITEA_AWESOME }}
          gitea_incredible: ${{ secrets.COOKIE_GITEA_INCREDIBLE }}
          gitea_instance: https://gitea.example.com
          gitea_repo: example/example
          workflow_file: deploy.yml
```

### Parameters

- `gitea_awesome`: `gitea_awesome` cookie
- `gitea_incredible`: `gitea_incredible` cookie
- `gitea_instance`: Gitea url. Must not ends with "/"
- `gitea_repo`: Repo name in gitea. Format is `{repo}/{name}`.
- `workflow_file`: Name of workflow file in target repo.

Currently, only latest action can be re-triggered.

## Warning

- This action uses cookie because there is no api to trigger gitea action. This
  causes some risk.
  - There is no scope for cookie. So, unexpected operation may be executed.
  - Cookie may be expired. (This can be extended by settings
    `LOGIN_REMEMBER_DAYS` but do it at your own risk.)
  - If gitea changed specification, this action may not work.
