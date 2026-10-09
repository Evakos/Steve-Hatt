export interface Testimonial {
  quote: string;
  /** How the customer wants to be shown, e.g. "Sarah, Islington". */
  name: string;
  /** Optional line under the name, e.g. "Regular since 2019". */
  detail?: string;
  /** Where a published quote came from, e.g. "Time Out London, 2010". Shown instead of `detail`. */
  source?: string;
  /** Link to the original, shown on the source line. */
  href?: string;
  /** True for sample text only. While any placeholder is present, the homepage grid shows a
   * "sample reviews" label so nothing invented is ever passed off as a real customer. */
  placeholder?: boolean;
}

/**
 * Customer reviews shown in the homepage grid (components/testimonials.tsx). Replace the sample
 * entries below with real quotes (with the customer's permission) and delete `placeholder: true`.
 * An empty list hides the section entirely.
 */
export const testimonials: Testimonial[] = [
  {
    quote: "Just expect first class fresh fish from this long-established fishmonger and you won't be disappointed.",
    name: "Time Out London",
    source: "Review, December 2010",
    href: "https://www.timeout.com/london/shopping/steve-hatt",
  },
  { quote: "Sample review: the freshness is what you notice first. Replace this with a real customer quote.", name: "Customer name", detail: "Islington", placeholder: true },
  { quote: "Sample review: friendly advice on what to buy and how to cook it. Replace with a real quote.", name: "Customer name", detail: "Regular customer", placeholder: true },
  { quote: "Sample review: collection was quick and the fish was prepared exactly as asked. Replace with a real quote.", name: "Customer name", detail: "Collection", placeholder: true },
  { quote: "Sample review: delivery arrived well packed and on time. Replace with a real quote.", name: "Customer name", detail: "Delivery", placeholder: true },
  { quote: "Sample review: the Christmas order was easy and everything was ready on the day. Replace with a real quote.", name: "Customer name", detail: "Christmas order", placeholder: true },
  { quote: "Sample review: the best fishmonger in the area. Replace with a real quote.", name: "Customer name", detail: "Local customer", placeholder: true },
];
