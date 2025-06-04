# Description

This markdown file contains a list of items that were installed when I started setting up
my Mac.

## Manual Installations

- brew
- docker desktop
- vscode
- discord
- slack

## Homebrew Packages

- ansible
- awscli
- git
- git-credential-manager
- gnupg
- pinentry-mac
- terraform
- terraform-docs
- python
- uv
- uvtools

### UV Installed Items

- ruff

## Environment Variables

- Added aliases to ~/.zshrc
  - alias ll='ls -lh'
  - alias python='python3'
  - alias pip='pip3'
- Added "pinentry-program /opt/homebrew/bin/pinentry-mac" to ~/.gnupg/gpg-agent.conf

## Git Configuration

- git config --global user.name "Your Name"
- git config --global user.email "Your Email"
- git config --global signing.key "Your GPG Key ID"
- git config --global commit.gpgsign true
- git config --global tag.gpgsign true
- git config --global gpg.program /opt/homebrew/bin/gpg
- git config --global credential.helper /usr/local/share/gcm-core/git-credential-manager
- git config --pull.rebase false

## Languages Added

- Go
- Python
- Rust
