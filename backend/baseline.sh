#!/bin/bash

echo "Starting Prisma Migration Baselining..."

# List of migrations to resolve
migrations=(
  "20260209091222_init"
  "20260212102305_add_isonline"
  "20260212163350_add_partner_role"
  "20260315200000_add_gender_to_user"
  "20260317164331_add_rider_management_fields"
  "20260317165447_add_rider_bank_details"
)

for migration in "${migrations[@]}"
do
  echo "Resolving migration: $migration"
  npx prisma migrate resolve --applied "$migration" || echo "Migration $migration already resolved or failed."
done

echo "Baselining complete."
