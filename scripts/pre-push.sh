#!/bin/sh
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "master" ]]; then
  echo "⏭️ NM. I'll just push";
else
  yarn build
  if [[ $NO_VERSION ]]; then
    echo "ok, I won't create a version"
  else
    npm version minor
  fi
fi
