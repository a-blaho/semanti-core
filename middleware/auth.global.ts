export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();
  const isSignedIn = user.value != null;

  const unprotectedRoutes = ["/", "/register"];
  const currentRoute = to.path;

  if (!isSignedIn && !unprotectedRoutes.includes(currentRoute)) {
    return navigateTo("/");
  }

  if (isSignedIn && unprotectedRoutes.includes(currentRoute)) {
    return navigateTo("/dashboard");
  }
});
