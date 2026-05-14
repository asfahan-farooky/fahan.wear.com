import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | Fahan Wear",
  description: "Terms and conditions for Fahan Wear, including pricing, returns, account verification, and product policies.",
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-500">Terms & Conditions</p>
          <h1 className="text-3xl font-light tracking-tight text-brand-900 sm:text-4xl">
            Our policies, product standards, and customer responsibilities
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-brand-500 sm:text-base">
            These terms explain our approach to product identification, pricing, returns, shipping costs, and account verification. They are designed to keep every purchase clear and secure.
          </p>
        </div>

        <div className="rounded-3xl border border-brand-grey-200 bg-brand-white p-8 shadow-sm">
          <div className="space-y-6 text-brand-700">
            <div>
              <h2 className="text-2xl font-medium">Product Codes & Identification</h2>
              <p className="mt-3 text-sm leading-7 text-brand-500">
                Every product on Fahan Wear is assigned a unique product code or SKU that identifies its exact style, color, and size. This code helps us track inventory accurately, support replacement requests, and ensure that the item you receive matches the product you ordered.
              </p>
              <p className="mt-3 text-sm leading-7 text-brand-500">
                Please keep your order confirmation and product code handy when contacting customer support for faster assistance.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-medium">Lowest Price Guarantee</h2>
              <p className="mt-3 text-sm leading-7 text-brand-500">
                We keep our prices low by maintaining an efficient supply chain, minimizing overhead, and offering focused, value-first collections.
                Our pricing reflects the best offer we can provide for the quality and craftsmanship of each item.
              </p>
              <p className="mt-3 text-sm leading-7 text-brand-500">
                If you believe a product is priced higher than a comparable offering from another seller, please contact us with details so we can review the price and ensure you receive the most competitive value available.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-medium">7-Day Returns Policy</h2>
              <p className="mt-3 text-sm leading-7 text-brand-500">
                Returns are accepted only when the product is defective or has a genuine functional issue. Examples include manufacturing defects, damaged goods, missing components, or functionality failures.
              </p>
              <p className="mt-3 text-sm leading-7 text-brand-500">
                Returns will not be processed for reasons such as change of mind, fit preferences, color preferences, or styling choices. Please choose carefully and review product details before placing your order.
              </p>

              <div className="mt-4 space-y-3 rounded-2xl border border-brand-grey-200 bg-brand-grey-50 p-5">
                <h3 className="text-base font-semibold">Return process</h3>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-brand-500">
                  <li>Notify us within 7 days of receiving the product and provide photos of the defect or functional issue.</li>
                  <li>Our team will review the request and confirm whether the issue meets our return criteria.</li>
                  <li>Once approved, send the item back in its original condition with all tags and packaging, if possible.</li>
                  <li>We will inspect the returned product and process your refund or replacement once the defect is verified.</li>
                </ol>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-medium">Shipping Cost Responsibility</h2>
              <p className="mt-3 text-sm leading-7 text-brand-500">
                Customers are responsible for covering shipping costs for both inbound and outbound transit when a return is initiated. This means you are responsible for the cost of sending the product back to us, as well as the cost of any shipment we use to send the replacement item or return confirmation.
              </p>
              <p className="mt-3 text-sm leading-7 text-brand-500">
                Shipping fees are separate from the product refund and are not reimbursed unless expressly stated in a specific promotion or exception made by our support team.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-medium">Account Creation & Verification</h2>
              <p className="mt-3 text-sm leading-7 text-brand-500">
                To protect your account and reduce fraud, we require verification during account creation. This may include verifying your mobile number, email address, or other details through a one-time password (OTP).
              </p>
              <p className="mt-3 text-sm leading-7 text-brand-500">
                Accounts that fail verification may be restricted until the verification process is completed. Verification ensures secure access to your order history, payment methods, and return requests.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-medium">Additional Terms</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-brand-500">
                <li>All orders are subject to availability. We reserve the right to cancel orders if items become unavailable.</li>
                <li>Any suspicious or fraudulent account activity may result in order review, delayed fulfillment, or account suspension.</li>
                <li>Our policies may be updated over time; the version on this page is the authoritative source for current terms.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-brand-grey-200 bg-brand-grey-50 p-8 text-sm text-brand-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Questions about these terms? Please contact our support team via the <Link href="/contact" className="font-semibold text-brand-700 underline">Contact</Link> page.
          </p>
          <Link href="/shop" className="inline-flex items-center justify-center rounded-full border border-brand-300 bg-white px-5 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-700 transition hover:bg-brand-grey-100">
            Continue shopping
          </Link>
        </div>
      </div>
    </section>
  );
}
