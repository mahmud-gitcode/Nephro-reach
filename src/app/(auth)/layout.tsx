import React from "react";

/* Login and registration are the door into the portal, so they are set in
   the portal's family, Roboto; see globals.css.
   `contents` keeps the wrapper out of the layout. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-typeface="portal" className="contents">
      {children}
    </div>
  );
}
