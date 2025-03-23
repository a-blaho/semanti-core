export default defineNuxtRouteMiddleware(async (to) => {
  const client = useSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user && to.path !== "/") {
    return navigateTo("/");
  }
});
