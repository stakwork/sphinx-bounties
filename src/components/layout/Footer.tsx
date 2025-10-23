import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative bg-neutral-100 border-t border-neutral-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 lg:gap-24">
          <div className="flex-shrink-0">
            <Link href="/" className="flex flex-col mb-6">
              <div className="relative w-12 h-12 mb-3">
                <Image
                  src="/sphinx_icon.png"
                  alt="Sphinx Bounties"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold uppercase leading-tight">
                <span className="text-neutral-900">FREEDOM</span>
                <br />
                <span className="text-neutral-900">TO EARN</span>
              </span>
            </Link>
            <p className="text-neutral-600 text-sm">
              Stakwork © Copyright {new Date().getFullYear()}
            </p>
          </div>

          <div className="flex gap-24">
            <div>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/bounties"
                    className="text-neutral-900 hover:text-neutral-600 font-medium transition-colors"
                  >
                    Start Earning
                  </Link>
                </li>
                <li>
                  <Link
                    href="/bounties"
                    className="text-neutral-900 hover:text-neutral-600 font-medium transition-colors"
                  >
                    View Bounties
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-neutral-900 hover:text-neutral-600 font-medium transition-colors"
                  >
                    Get Sphinx
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="https://stakwork.com"
                    className="text-neutral-900 hover:text-neutral-600 font-medium transition-colors"
                  >
                    Stakwork
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-neutral-900 hover:text-neutral-600 font-medium transition-colors"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://twitter.com/sphinx_chat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 hover:text-neutral-600 font-medium transition-colors"
                  >
                    X
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
