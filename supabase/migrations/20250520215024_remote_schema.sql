create table "public"."waitlist_templates" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "template_data" jsonb not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."waitlist_templates" enable row level security;

alter table "public"."waitlists" add column "published" boolean default false;

alter table "public"."waitlists" add column "url_slug" character varying(60);

CREATE INDEX idx_waitlist_templates_user_id ON public.waitlist_templates USING btree (user_id);

CREATE INDEX idx_waitlists_published ON public.waitlists USING btree (published);

CREATE INDEX idx_waitlists_url_slug ON public.waitlists USING btree (url_slug);

CREATE UNIQUE INDEX waitlist_templates_pkey ON public.waitlist_templates USING btree (id);

CREATE UNIQUE INDEX waitlists_url_slug_key ON public.waitlists USING btree (url_slug);

alter table "public"."waitlist_templates" add constraint "waitlist_templates_pkey" PRIMARY KEY using index "waitlist_templates_pkey";

alter table "public"."waitlist_templates" add constraint "waitlist_templates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."waitlist_templates" validate constraint "waitlist_templates_user_id_fkey";

alter table "public"."waitlists" add constraint "waitlists_url_slug_key" UNIQUE using index "waitlists_url_slug_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only generate a slug if the waitlist is being published and doesn't have a slug
    IF NEW.published = TRUE AND (NEW.url_slug IS NULL OR NEW.url_slug = '') THEN
        -- Generate base slug from name
        NEW.url_slug := generate_slug_from_name(NEW.name);
        
        -- Ensure slug is unique
        NEW.url_slug := ensure_unique_slug(NEW.url_slug);
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_customization_settings_for_waitlist()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.customization_settings (waitlist_id, custom_fields)
  VALUES (NEW.id, '{}');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_unique_slug(p_base_slug text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    slug TEXT := p_base_slug;
    suffix INTEGER := 1;
    existing_count INTEGER;
BEGIN
    -- Check if the slug already exists
    LOOP
        SELECT COUNT(*) INTO existing_count
        FROM public.waitlists
        WHERE url_slug = slug;
        
        -- If slug is unique, return it
        IF existing_count = 0 THEN
            RETURN slug;
        END IF;
        
        -- Otherwise append a number and try again
        slug := p_base_slug || '-' || suffix::TEXT;
        suffix := suffix + 1;
        
        -- Safety check to prevent infinite loop
        IF suffix > 1000 THEN
            RAISE EXCEPTION 'Could not generate a unique slug after 1000 attempts';
        END IF;
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_slug_from_name(p_name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    slug TEXT;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special characters
    slug := lower(p_name);
    slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g'); -- Remove special chars
    slug := regexp_replace(slug, '\s+', '-', 'g'); -- Replace spaces with hyphens
    slug := regexp_replace(slug, '-+', '-', 'g'); -- Replace multiple hyphens with single hyphen
    slug := trim(both '-' from slug); -- Remove leading/trailing hyphens
    
    -- Ensure slug is between 3 and 60 characters
    IF length(slug) < 3 THEN
        slug := slug || '-waitlist';
    END IF;
    
    IF length(slug) > 60 THEN
        slug := substring(slug from 1 for 60);
        slug := trim(both '-' from slug); -- Trim again in case we cut in the middle of a hyphen
    END IF;
    
    RETURN slug;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_waitlist_templates_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."waitlist_templates" to "anon";

grant insert on table "public"."waitlist_templates" to "anon";

grant references on table "public"."waitlist_templates" to "anon";

grant select on table "public"."waitlist_templates" to "anon";

grant trigger on table "public"."waitlist_templates" to "anon";

grant truncate on table "public"."waitlist_templates" to "anon";

grant update on table "public"."waitlist_templates" to "anon";

grant delete on table "public"."waitlist_templates" to "authenticated";

grant insert on table "public"."waitlist_templates" to "authenticated";

grant references on table "public"."waitlist_templates" to "authenticated";

grant select on table "public"."waitlist_templates" to "authenticated";

grant trigger on table "public"."waitlist_templates" to "authenticated";

grant truncate on table "public"."waitlist_templates" to "authenticated";

grant update on table "public"."waitlist_templates" to "authenticated";

grant delete on table "public"."waitlist_templates" to "service_role";

grant insert on table "public"."waitlist_templates" to "service_role";

grant references on table "public"."waitlist_templates" to "service_role";

grant select on table "public"."waitlist_templates" to "service_role";

grant trigger on table "public"."waitlist_templates" to "service_role";

grant truncate on table "public"."waitlist_templates" to "service_role";

grant update on table "public"."waitlist_templates" to "service_role";

create policy "Users can delete customization settings for their waitlists"
on "public"."customization_settings"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM waitlists
  WHERE ((waitlists.id = customization_settings.waitlist_id) AND (waitlists.owner_id = auth.uid())))));


create policy "Users can insert customization settings for their waitlists"
on "public"."customization_settings"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM waitlists
  WHERE ((waitlists.id = customization_settings.waitlist_id) AND (waitlists.owner_id = auth.uid())))));


create policy "Users can update customization settings for their waitlists"
on "public"."customization_settings"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM waitlists
  WHERE ((waitlists.id = customization_settings.waitlist_id) AND (waitlists.owner_id = auth.uid())))));


create policy "Users can view customization settings for their waitlists"
on "public"."customization_settings"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM waitlists
  WHERE ((waitlists.id = customization_settings.waitlist_id) AND (waitlists.owner_id = auth.uid())))));


create policy "trigger_create_profile"
on "public"."profiles"
as permissive
for insert
to service_role
with check (true);


create policy "Users can manage their own templates"
on "public"."waitlist_templates"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can create their own waitlists"
on "public"."waitlists"
as permissive
for insert
to public
with check ((auth.uid() = owner_id));


create policy "Users can delete their own waitlists"
on "public"."waitlists"
as permissive
for delete
to public
using ((auth.uid() = owner_id));


create policy "Users can update their own waitlists"
on "public"."waitlists"
as permissive
for update
to public
using ((auth.uid() = owner_id));


create policy "Users can view their own waitlists"
on "public"."waitlists"
as permissive
for select
to public
using ((auth.uid() = owner_id));


CREATE TRIGGER waitlist_templates_update_timestamp BEFORE UPDATE ON public.waitlist_templates FOR EACH ROW EXECUTE FUNCTION update_waitlist_templates_updated_at();

CREATE TRIGGER create_customization_settings_trigger AFTER INSERT ON public.waitlists FOR EACH ROW EXECUTE FUNCTION create_customization_settings_for_waitlist();

CREATE TRIGGER waitlist_auto_generate_slug BEFORE UPDATE ON public.waitlists FOR EACH ROW WHEN ((old.published IS DISTINCT FROM new.published)) EXECUTE FUNCTION auto_generate_slug();


