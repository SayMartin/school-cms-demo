# CLAUDE.md — Instructions for Claude Code

This file is read automatically by Claude Code at the start of every session.

## Project

**School CMS Demo** — a generic, headless school CMS built with Next.js and
Cloudflare Workers/D1/R2, showcased through one example implementation:
**Demo Folk High School**, a fictional Swedish folk high school.
The example content models what replacing a legacy WordPress/SQLite site with
this CMS would look like — it has no connection to any real school.

## Agent Instructions

All architecture, conventions, rules, and tech stack details are in **[AGENTS.md](AGENTS.md)**.
Read that file before making any changes.

## Do Not

- Do not use the Pages Router — this project uses App Router exclusively.
- Do not use `any` in TypeScript — always type properly.
- Do not commit `.env` or `.env.local` files.
- Do not add unnecessary abstractions or helpers for one-off operations.
