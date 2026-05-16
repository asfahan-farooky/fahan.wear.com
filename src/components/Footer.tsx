// src/components/Footer.tsx
import Link from "next/link";
import { FaInstagram, FaFacebook, FaYoutube, FaSnapchat } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t border-brand-grey-100 bg-brand-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <p className="text-sm uppercase tracking-widest text-brand-400">
            © 2026 𝔽𝕒𝕙𝕒𝕟 𝕎𝕖𝕒𝕣
          </p>
          <div className="flex gap-8 text-sm uppercase tracking-wider text-brand-500">
            <Link href="/shop" className="hover:text-brand-900">
              Shop
            </Link>
            <Link href="/about" className="hover:text-brand-900">
              About
            </Link>
            <Link href="/contact" className="hover:text-brand-900">
              Contact
            </Link>
            <Link href="/terms" className="hover:text-brand-900">
              T&C
            </Link>
          </div>
          <div className="flex gap-5 text-brand-500">
            <a href="https://www.instagram.com/fahan_wear?igsh=MWwwZjU5bG5haDAyOA==" target="_blank">
              <FaInstagram className="hover:text-brand-900 cursor-pointer" />
            </a>

            <a href="https://www.facebook.com/share/1Cpm1Xb3rq/" target="_blank">
              <FaFacebook className="hover:text-brand-900 cursor-pointer" />
            </a>

            <a href="https://www.snapchat.com/add/fahanwear?share_id=y4vSMfpOoyo&locale=en-IN" target="_blank">
              <FaSnapchat className="hover:text-brand-900 cursor-pointer" />
            </a>

            {/* <a href="https://youtube.com/@yourchannel" target="_blank">
              <FaYoutube className="hover:text-brand-900 cursor-pointer" />
            </a> */}
          </div>
        </div>
      </div>
    </footer>
  );
}