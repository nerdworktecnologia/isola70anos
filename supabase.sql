create table if not exists arrivals (
  id text primary key,
  arrived boolean not null default false
);

create table if not exists store (
  key text primary key,
  value jsonb not null
);

create table if not exists user_aliases (
  username text primary key,
  email text not null
);

create index if not exists idx_arrivals_id on arrivals (id);
create index if not exists idx_store_key on store (key);
create index if not exists idx_user_aliases_email on user_aliases (email);

alter table arrivals enable row level security;
alter table store enable row level security;
alter table user_aliases enable row level security;

create policy arrivals_select_authenticated
  on arrivals for select
  to authenticated
  using (true);

create policy arrivals_upsert_authenticated
  on arrivals for insert
  to authenticated
  with check (true);

create policy arrivals_update_authenticated
  on arrivals for update
  to authenticated
  using (true)
  with check (true);

create policy arrivals_select_anon
  on arrivals for select
  to anon
  using (true);

create policy arrivals_upsert_anon
  on arrivals for insert
  to anon
  with check (true);

create policy arrivals_update_anon
  on arrivals for update
  to anon
  using (true)
  with check (true);

create policy store_select_authenticated
  on store for select
  to authenticated
  using (true);

create policy store_upsert_authenticated
  on store for insert
  to authenticated
  with check (true);

create policy store_update_authenticated
  on store for update
  to authenticated
  using (true)
  with check (true);

create policy store_select_anon
  on store for select
  to anon
  using (true);

create policy store_upsert_anon
  on store for insert
  to anon
  with check (true);

create policy store_update_anon
  on store for update
  to anon
  using (true)
  with check (true);

create policy user_aliases_select_authenticated
  on user_aliases for select
  to authenticated
  using (true);

create policy user_aliases_insert_self
  on user_aliases for insert
  to authenticated
  with check (email = auth.email());

create policy user_aliases_update_self
  on user_aliases for update
  to authenticated
  using (email = auth.email())
  with check (email = auth.email());

-- Allow authenticated users to delete from all tables
create policy arrivals_delete_authenticated
  on arrivals for delete
  to authenticated
  using (true);

create policy store_delete_authenticated
  on store for delete
  to authenticated
  using (true);

create policy user_aliases_delete_authenticated
  on user_aliases for delete
  to authenticated
  using (true);
