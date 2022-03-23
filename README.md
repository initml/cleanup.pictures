# [CleanUp.pictures](https://cleanup.pictures)

![preview](./docs/demo.gif)

This is the code repository for [CleanUp.pictures](https://cleanup.pictures), a free web application that lets you quickly cleanup or remove objects in any image.

[CleanUp.pictures](https://cleanup.pictures) consists in 3 main blocks:

- A frontend built with [React](https://reactjs.org/) / [Typescript](https://www.typescriptlang.org/) / [TailwindCSS](https://tailwindcss.com/)
- A Nodejs Firebase function to proxy the fetch requests on a secure HTTPS endpoint with [AppCheck/reCAPTCHA v3](https://firebase.google.com/docs/app-check)
- An inpainting service running [LaMa](https://github.com/saic-mdal/lama) on GPU. [Here](https://github.com/Sanster/lama-cleaner) is an example implementation by [@Sanster](https://github.com/Sanster) that you can run locally

## Setup

1. Function: `cd functions && npm i`
2. Frontend: `npm i`

Then edit the [.env](.env) file (or add a new `.env.local` file) that matches your firebase & backend settings.

To point the frontend to the local functions emulator, update your .env file with:

```
REACT_APP_INPAINTING_ENDPOINT=http://localhost:5001/cleanup-pictures/us-central1/cleanup
```

## In-painting API

If you don't have access to GPUs and/or don't want to deploy the service on remote GPUs,
we provide an API that can be used to run fast high resolution inpainting.

The documentation is available here: https://initml-apis.web.app/docs/cleanup

## Development

1. Function: `cd functions && npm run serve`
2. Frontend: `npm run dev`

## Deployment

1. Function: `firebase deploy --only functions`
2. Frontend: The frontend is automatically deployed when a PR is created/merged

## Acknowledgements

CleanUp.pictures wouldn't be possible without [LaMa: Resolution-robust Large Mask Inpainting with Fourier Convolutions](https://github.com/saic-mdal/lama) by Samsung Research.
