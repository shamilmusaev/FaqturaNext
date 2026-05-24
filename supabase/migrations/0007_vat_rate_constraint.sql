alter table organizations
  add constraint organizations_vat_rate_check
  check (default_vat_rate in (0, 6, 12, 25));
