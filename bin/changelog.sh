#!/bin/bash
# Changelog generator
# @author wpomier 2022-06-29
ROOT_DIR=$(pwd -P)

_logTag() {
  local fromtag="$1"
  local totag="$2"
  echo -e "\n## ${totag:-v${npm_package_version}}\n"
  if [ -n "$fromtag" -a -n "$totag" ]; then tags="${fromtag}..${totag}";
  elif [ -n "$fromtag" -a -z "$totag" ]; then tags="${fromtag}..";
  else tags="$totag"
  fi
  git log --oneline ${tags} | sed -r 's/^......../* /; /^\* [0-9]+\.[0-9]+\.[0-9]+($| -.*)/d; '
}

changeLog() {
  local fromtag=""
  local totag=""
  local tags=$(git tag | sort -r)
  {
    echo "# CHANGELOG"
    while read fromtag; do
      test -n "$totag" && _logTag "${fromtag}" "${totag}"
      test -z "$totag" && _logTag "${fromtag}" ""
      totag="${fromtag}"
    done <<<"$tags"
    test -n "$fromtag" && _logTag "" "$fromtag"
  } > "$ROOT_DIR/CHANGELOG.md"
  return 0
}

changeLog
