import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../styles.css?url";

const APP_NAME = "SWIPE FORCE";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
      { title: APP_NAME },
      { name: "description", content: "SWIPE FORCE — retro arcade vertical shooter" },
      { name: "theme-color", content: "#00ff00" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body className="m-0 min-h-dvh overflow-hidden bg-black text-white antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
