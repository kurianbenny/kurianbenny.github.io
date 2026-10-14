---
title: "Moving or upgrading a server? Important steps to follow"
description: "Plan backups, compatibility, data transfer, cutover, and rollback before moving a live website or application to another server."
date: 2026-10-14
category: "Hosting & migrations"
draft: false
image: "/images/blog/server-migration-essential-steps.webp"
imageAlt: "Editorial illustration of data moving between two servers with backup and protection symbols."
---

A server migration can be triggered by growth, an outdated environment, a hosting change, or a need for a better operating setup. The visible task is moving an application. The difficult part is preserving its behaviour and data while the running environment changes.

Treat a migration as a planned release with a recovery path, rather than a one-time file copy.

## 1. Record what runs on the current server

Create an inventory of the application runtime, database version, web server, background workers, scheduled tasks, uploaded files, and integrations. Note environment settings and certificates without copying secrets into public documentation.

Include the quiet dependencies: email delivery, webhook endpoints, external allowlists, mounted storage, and jobs that run only once a day. A homepage check will not reveal every missing dependency.

## 2. Define the cutover and recovery plan

Decide who will perform the move, when it will happen, and which visitor journeys must pass before it is accepted. Choose a maintenance window when needed and communicate expected impact.

Write down what would cause you to stop or roll back. A rollback needs more than an old server: it needs a decision about any new data written after the move. Restoring an older database can lose those changes unless the data is reconciled.

## 3. Take backups and verify recovery

Back up the application, database, user uploads, and configuration through appropriate protected mechanisms. Check that the required backup can be restored into a separate environment.

A server snapshot and an application-aware database backup serve different purposes. Do not assume an image taken while writes are in progress is sufficient for every workload.

[DigitalOcean’s snapshot migration guide](https://docs.digitalocean.com/products/snapshots/how-to/migrate-droplets/) documents moving Droplets using snapshots and retaining the original resources while verifying the migration. Follow the procedure appropriate to your provider and database rather than assuming one copying method fits all systems.

## 4. Prepare and test the destination

Check runtime and database compatibility, file permissions, network rules, HTTPS, and the application’s configuration. Restore a test copy and exercise the actual workflows.

When moving to a larger server, avoid silently changing several major software versions at the same time unless the plan specifically covers that work. Separating an infrastructure move from a framework upgrade makes failures easier to isolate.

## 5. Make the final data transfer consistent

Choose how the application’s writes will be handled during the final transfer. A small application may use a controlled maintenance period. A larger system may need a carefully designed replication or synchronization process.

The important rule is that the application should not accidentally write independent new records to both servers. Account for background jobs and webhook processing as well as browser requests.

## 6. Switch traffic deliberately

Plan DNS or routing changes in advance. If lowering a DNS time-to-live, do it early enough for the previous caching period to expire before the intended switch. Cached answers can keep some visitors on the old destination.

Verify HTTPS and public URLs after the switch. Check forms, logins, database writes, uploads, scheduled jobs, and integrations. Monitor application errors and resource usage while real traffic reaches the new environment.

## 7. Keep the old environment until the move is accepted

Retain the original resources for an agreed verification period, with clear control over whether they can still accept writes. Do not delete them simply because the new homepage loads.

Confirm the backup process, update the deployment documentation, and remove obsolete access only after the migration is accepted and the recovery plan has been reviewed.

Need help planning the move? Explore [cloud, DevOps, and server management](/services/devops/) or [start a conversation](/contact/).
