<div align="center">

# 🎬 Media Tracker

**Track movies, series, books and games in one place — with personal libraries, reviews, progress tracking and social features.**

[![Status](https://img.shields.io/badge/status-pre--alpha-f59e0b?style=flat-square)](#-project-status)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=000000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

**[🌐 Live app](https://frostiq.app)** · **[📦 Repository](https://github.com/josueterrones2004/media-tracker)**

</div>

---

Media Tracker is a full-stack web application for keeping track of the movies, series, books and video games you consume.

The project combines a personal media library with social features such as public profiles, follows, activity feeds, reviews, favorites and progress tracking. It is built as an evolving personal product rather than a finished one, so features and design continue to change as the project grows.

> **Language:** the interface is currently available only in **Spanish**. English support and broader localization are planned for a future update.
>
> **Project status:** Media Tracker is currently in **pre-alpha** and under active development. It is not a finished product.

## ✨ What it includes

- 🎬 Movies, series, books and video games in the same library.
- 📚 Personal status tracking for pending, active, abandoned and completed media.
- ⭐ Ratings from 0.5 to 5 stars, including half-stars.
- 👍 Like / dislike reactions on media entries.
- 📝 Optional written reviews with spoiler support.
- 🔁 Rewatch, reread and replay tracking.
- 📺 Episode-level progress for series.
- 👤 Customizable public profiles with avatar, banner, bio and favorites.
- 👥 Followers, following, activity feeds and social reviews.
- 🔔 Notifications and user search.
- 🔎 Search across movies, series, books, games and users.
- 📱 Installable PWA experience with standalone mode.
- 📰 In-app changelog support for new versions.

---

## 📚 Personal library

Media Tracker supports four types of media:

- 🎬 Movies
- 📺 Series
- 📖 Books
- 🎮 Video games

Each user can organize their library using states such as:

- Pending
- Watching
- Reading
- Playing
- Abandoned
- Completed / watched / read

Active states behave like toggles, so selecting the same state again removes the item from that category.

For series, removing a show from **Watching** does not erase the episodes that were already registered as watched.

---

## ⭐ Reviews and ratings

A media entry can be registered even without a written review.

Entries can include:

- A rating from **0.5 to 5 stars**
- Half-star ratings
- Like / dislike
- Optional review text
- Spoiler marking
- Rewatch, reread or replay information
- Registration date

Reviews can be edited or removed later.

Media Tracker uses its own confirmation interface for review deletion instead of relying on the browser's default popup.

---

## 📺 Series progress

Series include episode-level tracking.

Media Tracker keeps information such as:

- Season
- Episode number
- Episode title
- Watch date
- Rewatch state

Episode history is stored independently from the current library status of the series, so previously watched episodes remain available even if the show is no longer marked as **Watching**.

---

## 🎮 Video games

Games can be organized as:

- Playing
- Pending
- Abandoned
- Completed

Completed games behave like the other media types and can open their saved entry or review directly.

Replay records can also be added without removing previous completions.

---

## 👤 Profiles

Each user has a customizable profile with support for:

- Display name
- Username
- Bio
- Avatar
- Banner
- Custom image cropping
- Favorite movies
- Favorite series
- Favorite books
- Favorite games
- Configurable profile sections
- Recent activity
- Followers and following

Profiles can also display special roles such as **Owner** and **Beta Tester**.

---

## 👥 Social features

Media Tracker includes a social layer for discovering what other users are watching, reading and playing.

Current social features include:

- Follow / unfollow
- Public profiles
- Followers and following lists
- Activity feed
- Likes on activity
- Reviews from followed users
- Notifications
- User search

The home dashboard also brings together personal library progress, recent activity and reviews from people you follow.

---

## 🔎 Search and discovery

The application includes search for:

- Movies
- Series
- Books
- Video games
- Users

Media data is pulled from external providers including **TMDB**, **Open Library** and **IGDB**.

---

## 📱 Installable PWA

Media Tracker can be installed as a Progressive Web App.

On supported browsers, the application can show an installation option directly from the site. Once installed, it can:

- Appear with its own icon on the device.
- Open in standalone mode.
- Behave more like an installed application instead of a regular browser tab.

On iPhone and iPad, Media Tracker shows a short guide for using:

```text
Share → Add to Home Screen → Add
```

---

## 📰 In-app changelog

Media Tracker includes an in-app changelog system for new versions.

When a new version is published, the application can show its changes automatically and remember that the changelog has already been seen in that browser.

---

## 🧰 Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend / Data | Supabase, PostgreSQL |
| Media providers | TMDB, Open Library, IGDB |
| Deployment | Vercel |

Supabase is used for authentication, profiles, library data, reviews, activity and social features.

---

## 🚧 Project status

Media Tracker is a **pre-alpha project in constant evolution**.

It is not intended to represent a finished commercial product yet. Features may be incomplete, redesigned, replaced or removed while the application continues to evolve.

Current development focuses on improving the overall product experience, refining existing systems and expanding the platform over time.

### 🌍 Language support

The application interface is currently available only in **Spanish**.

English support is planned for a future version, with the goal of making the interface easier to localize into additional languages later on.

---

## 🗓️ Development history

### v0.1.0 — September 25, 2026

The first functional version introduced the core Media Tracker experience:

- Movies, series and books.
- Personal library states.
- Reviews and like / dislike reactions.
- Rewatch and reread tracking.
- Episode tracking for series.
- Custom profiles and favorites.
- Public profiles, follows and activity feeds.
- Early video game support.
- Initial search and navigation.

### v0.2.0 — September 30, 2026

The first major update expanded and refined the application with:

- Half-star ratings from 0.5 to 5.
- Optional written reviews.
- Review editing and deletion.
- Toggle-based library states.
- Persistent episode history for series.
- Improved replay support for games.
- Major responsive and mobile UI improvements.
- Redesigned profiles and social pages.
- PWA installation support.
- In-app changelog support.

### v0.3.0 — October 8, 2026

This release focused on a broader product and architecture refresh across the application:

- Reworked media detail pages with shared layouts, action bars, ratings and review components.
- Added a new unified search and discovery layer across TMDB, Open Library and IGDB.
- Introduced dedicated mobile discovery, bottom navigation and improved mobile search flows.
- Added owner-protected administration tools for media artwork management.
- Added an in-app bug reporting flow and an admin reports area.
- Expanded PWA support with a manifest, install prompts and updated application icons.
- Redesigned authentication, profiles, notifications and several core media pages.
- Refactored shared media and activity logic to make the codebase easier to extend.

---

## 🧪 Early-stage software

Because Media Tracker is still in pre-alpha, you may encounter bugs, unfinished features or behavior that changes between versions.

That is expected at this stage of the project — the application is being actively built, tested and refined over time.
