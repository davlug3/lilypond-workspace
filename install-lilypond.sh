#!/usr/bin/env bash
# Install LilyPond from the official generic binaries linked at:
#   https://lilypond.org/download.html
#
# Default: LilyPond 2.26.0 (current stable on that page).
#
# Usage:
#   ./install-lilypond.sh [--version 2.26.0] [--prefix ~/bin] [--force] [--apt]
#
#   --version X.Y.Z  LilyPond version to install (default: 2.26.0)
#   --prefix DIR     Where to unpack (default: ~/bin).
#                    Layout: <prefix>/lilypond-<ver>/bin/lilypond
#                    plus a symlink <prefix>/lilypond -> lilypond-<ver>/bin/lilypond
#   --force          Re-download + re-extract even if already installed
#   --apt            Install via apt (Ubuntu/Debian) instead of generic tarball.
#                    NOTE: distro packages are often older than stable.
#   -h, --help       Show this help
#
# Examples:
#   ./install-lilypond.sh
#   LILYPOND_VERSION=2.26.0 INSTALL_PREFIX=~/.local ./install-lilypond.sh
#   ./install-lilypond.sh --apt   # sudo apt install lilypond
#
set -euo pipefail

VERSION="${LILYPOND_VERSION:-2.26.0}"
PREFIX="${INSTALL_PREFIX:-$HOME/bin}"
FORCE=0
USE_APT=0

usage() {
  cat <<'EOF'
Install LilyPond from the official generic binaries linked at:
  https://lilypond.org/download.html

Usage:
  ./install-lilypond.sh [--version 2.26.0] [--prefix ~/bin] [--force] [--apt]
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="${2:?--version needs a value like 2.26.0}"; shift 2 ;;
    --prefix) PREFIX="${2:?--prefix needs a directory}"; shift 2 ;;
    --force) FORCE=1; shift ;;
    --apt) USE_APT=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done

# Expand ~ in PREFIX (bash does not expand it inside a variable)
PREFIX="${PREFIX/#\~/$HOME}"

say() { printf '==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

# --- apt path (distro package, may be older) ---
if [ "$USE_APT" -eq 1 ]; then
  say "Installing LilyPond via apt (distro version, may be older than $VERSION)..."
  if ! have apt-get; then
    die "apt-get not found; omit --apt to use the generic binary tarball."
  fi
  sudo apt-get update
  sudo apt-get install -y lilypond
  lilypond --version | head -n 2
  say "Done."
  exit 0
fi

# --- Detect platform for generic binaries (from lilypond.org/download.html) ---
OS="$(uname -s)"
ARCH="$(uname -m)"

FILENAME=""
URL=""

case "$OS" in
  Linux)
    case "$ARCH" in
      x86_64|amd64)
        FILENAME="lilypond-${VERSION}-linux-x86_64.tar.gz"
        URL="https://gitlab.com/lilypond/lilypond/-/releases/v${VERSION}/downloads/${FILENAME}"
        ;;
      *) die "Generic Linux binary is only published for x86_64 (you have: $ARCH). Use --apt or build from source: https://lilypond.org/source.html" ;;
    esac
    ;;
  Darwin)
    case "$ARCH" in
      x86_64)
        FILENAME="lilypond-${VERSION}-darwin-x86_64.tar.gz"
        URL="https://gitlab.com/lilypond/lilypond/-/releases/v${VERSION}/downloads/${FILENAME}"
        ;;
      arm64|aarch64)
        FILENAME="lilypond-${VERSION}-darwin-arm64.tar.gz"
        URL="https://gitlab.com/lilypond/lilypond/-/releases/v${VERSION}/downloads/${FILENAME}"
        ;;
      *) die "Unsupported macOS arch: $ARCH" ;;
    esac
    ;;
  MINGW*|MSYS*|CYGWIN*|Windows_NT)
    FILENAME="lilypond-${VERSION}-mingw-x86_64.zip"
    URL="https://gitlab.com/lilypond/lilypond/-/releases/v${VERSION}/downloads/${FILENAME}"
    ;;
  *)
    die "Unsupported OS: $OS. See https://lilypond.org/download.html for manual options."
    ;;
esac

say "LilyPond $VERSION for $OS/$ARCH"
say "Source page: https://lilypond.org/download.html"
say "Download URL: $URL"
say "Install prefix: $PREFIX"

DEST_DIR="$PREFIX/lilypond-$VERSION"
BIN="$DEST_DIR/bin/lilypond"
LINK="$PREFIX/lilypond"

if [ "$FORCE" -eq 0 ] && [ -x "$BIN" ]; then
  say "Already installed at $BIN — skipping download (use --force to reinstall)."
  "$BIN" --version | head -n 1
  # Ensure convenience symlink exists
  if [ ! -e "$LINK" ]; then
    ln -s "$BIN" "$LINK"
    say "Created symlink: $LINK"
  fi
  exit 0
fi

have curl || die "curl is required (sudo apt install curl)."
case "$FILENAME" in
  *.zip) have unzip || die "unzip is required for the Windows .zip (sudo apt install unzip)." ;;
  *.tar.gz) have tar || die "tar is required." ;;
esac

mkdir -p "$PREFIX"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
ARCHIVE="$TMP/$FILENAME"

say "Downloading..."
curl -fSL --retry 3 -o "$ARCHIVE" "$URL"

say "Extracting to $PREFIX/..."
case "$FILENAME" in
  *.tar.gz)
    tar -xzf "$ARCHIVE" -C "$PREFIX"
    ;;
  *.zip)
    unzip -q -o "$ARCHIVE" -d "$PREFIX"
    ;;
esac

# The tarball/zip extracts a top-level dir like lilypond-2.26.0(-linux-x86_64)?
# Normalize it to $DEST_DIR so the layout is predictable.
if [ ! -x "$BIN" ]; then
  # Find the extracted lilypond binary (one level deep)
  CANDIDATE="$(find "$PREFIX" -maxdepth 3 -path '*/bin/lilypond' -type f 2>/dev/null | head -n 1 || true)"
  if [ -n "${CANDIDATE:-}" ]; then
    EXTRACTED_DIR="$(dirname "$(dirname "$CANDIDATE")")"
    if [ "$EXTRACTED_DIR" != "$DEST_DIR" ]; then
      say "Normalizing $EXTRACTED_DIR -> $DEST_DIR"
      rm -rf "$DEST_DIR"
      mv "$EXTRACTED_DIR" "$DEST_DIR"
    fi
  fi
fi

[ -x "$BIN" ] || die "Install failed: $BIN not found after extraction."

# Convenience symlink: <prefix>/lilypond -> <prefix>/lilypond-<ver>/bin/lilypond
ln -sfn "$BIN" "$LINK"
say "Linked $LINK -> $BIN"

# PATH hint
case ":$PATH:" in
  *":$PREFIX:"*) ;;
  *) say "NOTE: $PREFIX is not on your PATH. Add:  export PATH=\"$PREFIX:\$PATH\"" ;;
esac

say "Verifying..."
"$BIN" --version | head -n 2
lilypond --version 2>/dev/null | head -n 1 || echo "(tip) run with: $BIN --version  or  $LINK --version"

say "Done. LilyPond $VERSION installed."
