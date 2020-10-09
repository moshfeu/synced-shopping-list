#!/bin/sh
yarn build
if [[ $NO_VERSION ]]; then
  echo "ok, I won't create a version"
else
  npm version minor
fi
