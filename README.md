# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## How to Run Vangular!

An e-commerce webstore with JAMstack architecture.

Tools and frameworks:

```
Astro: Static site generator excellent for SEO, page optimization and speed
Sanity: Headless CMS for all product info, more robust than product info in Stripe
Stripe: Payments processor, Vangular uses embedded checkout
Netlify: Webhost that allows for automated builds, serverless functions, Git integration and website deployment
ngrok: To have static web address when developing locally for Stripe Checkout and testing serverless functions
```

When testing serverless functions:

```
$ netlify dev
$ ngrok http --url=raccoon-allowed-wahoo.ngrok-free.app 8888
```

When checking out frontend and UI:

```
npm run dev
```

# Sanity

Used as headless CMS for Vangular products. Update the following files as needed if any product fields are or are not required:

```
src/types/sanity-schema.ts
src/lib/sanity-client.ts
```

# UI

Documentation for image and font sources used in website.

Fonts Used

Primary:
Primary Source:

Secondary:
