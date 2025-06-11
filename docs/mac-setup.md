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
- hashicorp/tap/terraform (after brew tap hashiciorp/tap)
- terraform-docs
- python
- node
- uv
- uvtools
- watch

### UV Installed Items

- ruff (maybe just pip install this?)

## NPM Packages

Needed to tell NPM about system certs:

```bash
security find-certificate -a -p /Library/Keychains/System.keychain > ~/system-certs.pem
echo 'export NODE_EXTRA_CA_CERTS=~/system-certs.pem' >> ~/.zshrc
source ~/.zshrc
```

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
