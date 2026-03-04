---
name: "i18n-automated-manager"
description: "Automatically manage translations in jizou.io. Force the agent to write keys directly into JSON files."
---

# i18n Automated Manager

## Rules for the Agent
- **Direct File Access:** When creating or modifying a component, you MUST open and edit `locales/en.json`, `locales/es.json`, and `locales/ja.json`.
- **Key Generation:** If a text string is needed (e.g., "Welcome"), generate a key like `pages.home.welcome` and insert it into the JSON files.
- **No Placeholders:** Do not ask the user to add the keys. Use your `edit_file` skill to update the locales folder immediately.
- **Synchronization:** Ensure the new key exists in ALL three languages (EN, ES, JA). If you don't know the Japanese translation, use the English version as a fallback, but create the key.

## File Paths
- English: `locales/en.json`
- Spanish: `locales/es.json`
- Japanese: `locales/ja.json`

## Example Workflow
User: "Add a login button to the header."
Agent: 
1. Reads `locales/en.json`.
2. Adds `"login": "Log In"` under the `auth` section.
3. Repeats for `es.json` ("Iniciar sesión") and `ja.json` ("ログイン").
4. Updates `components/JizouHeader.vue` using `$t('auth.login')`.