![CI][ci]

# Lipi

A Notion-style SaaS web app with real-time collaboration and customizable workspaces, built with Next.js, shadcn/ui and Tailwind CSS.

**[Live demo][site]**

> Lipi is a portfolio showcase project (declared goal), not a commercial product.

Product requirements: [docs/requirements/requirements.md](docs/requirements/requirements.md). Open work: [docs/TODO.md](docs/TODO.md). Other docs live in [docs/](docs/).

## Building from Source

- Fetch latest source code from master branch.

```
git clone https://github.com/rajput-hemant/lipi
cd lipi
```

- Install Bun 1.4.2, then follow [docs/local-development.md](docs/local-development.md). In short: copy **.env.example** to **.env.local**, then:

```
bun i
bun run db:up        # Postgres, Redis, REST adapter only (no app container)
bun run db:setup     # auth tables, Lipi tables, local seed
bun run dev
```

### Deploy Your Own

The button below clones the repository into Vercel and prompts for the core variables (auth, database, Redis). It deploys the Next.js app only, so the result is not complete on its own:

- Real-time collaboration needs the standalone Hocuspocus process (`bun run realtime:start`) on an always-on Node.js host. It is not a Vercel function. Set `NEXT_PUBLIC_LIPI_REALTIME_URL` and `LIPI_REALTIME_ALLOWED_ORIGINS` as described in [docs/guides/realtime.md](docs/guides/realtime.md). Without them the editor has no realtime endpoint in production.
- Password recovery email needs `RESEND_API_KEY` and `EMAIL_FROM` in production; locally the reset link is logged to the terminal instead.
- Billing (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`) and uploads (`UPLOADTHING_TOKEN`, `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`) are optional and not prompted for. Those features stay disabled until you add them.
- The database schema is not migrated by the deploy; run `bun run db:migrate` against your database. `bun run db:auth` is for local databases only (it refuses non-loopback URLs); an existing deployment keeps the auth tables it already has, see [docs/local-development.md](docs/local-development.md). See [.env.example](.env.example) for every variable.

[![Deploy with Vercel](https://vercel.com/button)][deploy]

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

[ci]: https://github.com/rajput-hemant/lipi/actions/workflows/ci.yml/badge.svg
[site]: https://lipi.rajputhemant.me
[deploy]: https://vercel.com/new/clone?repository-url=https://github.com/rajput-hemant/lipi&project-name=lipi&repo-name=lipi&env=BETTER_AUTH_SECRET,BETTER_AUTH_URL,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,DATABASE_URL,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,ENABLE_RATE_LIMITING,RATE_LIMITING_REQUESTS_PER_SECOND
