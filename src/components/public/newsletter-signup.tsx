"use client";

import { ArcScope } from "@/components/arc/arc-scope";
import { NewsletterSignup as ArcNewsletter } from "@/components/arc/blocks/newsletter-signup/newsletter-signup";
import { subscribeNewsletter } from "@/app/contacto/actions";
import { blogCopy } from "@/lib/blog";

/** The diario newsletter box: the address is stored in the DB (newsletter_subscriber) and listed in admin Mensajes. */
export function NewsletterSignup() {
  return (
    <ArcScope className="overflow-hidden rounded-[2rem] bg-white shadow-public">
      <ArcNewsletter
        variant="inline"
        title={blogCopy.newsletterTitle}
        description={blogCopy.newsletterBody}
        placeholder={blogCopy.newsletterPlaceholder}
        buttonLabel={blogCopy.newsletterButton}
        privacyNote={blogCopy.newsletterPrivacy}
        privacyLink={null}
        readers={null}
        publication={null}
        onSubscribe={(email) => subscribeNewsletter(email)}
      />
    </ArcScope>
  );
}
