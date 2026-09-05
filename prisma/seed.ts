import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randomDate(daysBack: number): Date {
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - daysBack);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("demo1234", 10);

  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
    },
  });

  console.log(`Workspace: ${workspace.name} (${workspace.id})`);

  await prisma.user.upsert({
    where: { email: "demo-admin@example.com" },
    update: {},
    create: {
      email: "demo-admin@example.com",
      name: "Admin User",
      passwordHash: hashedPassword,
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "demo-analyst@example.com" },
    update: {},
    create: {
      email: "demo-analyst@example.com",
      name: "Analyst User",
      passwordHash: hashedPassword,
      role: "ANALYST",
      workspaceId: workspace.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "demo-viewer@example.com" },
    update: {},
    create: {
      email: "demo-viewer@example.com",
      name: "Viewer User",
      passwordHash: hashedPassword,
      role: "VIEWER",
      workspaceId: workspace.id,
    },
  });

  console.log("Users created.");

  const themesData = [
    { name: "Performance", description: "Issues related to application speed and responsiveness" },
    { name: "UX/Design", description: "User interface and design feedback" },
    { name: "Mobile", description: "Mobile application specific feedback" },
    { name: "Checkout", description: "Checkout and payment process feedback" },
    { name: "API/Integration", description: "API and third-party integration feedback" },
    { name: "Security", description: "Security and authentication feedback" },
    { name: "Support", description: "Customer support experience feedback" },
    { name: "Features", description: "Feature requests and missing functionality" },
  ];

  const themes = [];
  for (const t of themesData) {
    const theme = await prisma.theme.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: t.name } },
      update: { description: t.description },
      create: {
        name: t.name,
        description: t.description,
        workspaceId: workspace.id,
      },
    });
    themes.push(theme);
  }

  console.log("Themes created.");

  const themeMap: Record<string, string> = {};
  for (const t of themes) {
    themeMap[t.name] = t.id;
  }

  const customerNames = [
    "Alice Johnson", "Bob Smith", "Charlie Davis", "Diana Wilson", "Ethan Brown",
    "Fiona Martinez", "George Anderson", "Hannah Taylor", "Ivan Thomas", "Julia Jackson",
    "Kevin White", "Laura Harris", "Mike Clark", "Nancy Lewis", "Oscar Robinson",
  ];

  const customerEmails = [
    "alice@example.com", "bob@example.com", "charlie@example.com", "diana@example.com",
    "ethan@example.com", "fiona@example.com", "george@example.com", "hannah@example.com",
    "ivan@example.com", "julia@example.com", "kevin@example.com", "laura@example.com",
    "mike@example.com", "nancy@example.com", "oscar@example.com",
  ];

  type FeedbackSeed = {
    content: string;
    source: "SUPPORT" | "APP_REVIEW" | "SURVEY" | "SALES" | "MANUAL" | "SIMULATED";
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    status: "NEW" | "REVIEWED" | "RESOLVED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    category: string;
    themes: string[];
    rating: number | null;
  };

  const feedbackItems: FeedbackSeed[] = [
    { content: "Checkout takes too long on mobile.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "NEW", priority: "HIGH", category: "Checkout", themes: ["Mobile", "Checkout", "Performance"], rating: 2 },
    { content: "I love the new dashboard.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 5 },
    { content: "The support team solved my issue quickly.", source: "SUPPORT", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Support", themes: ["Support"], rating: 5 },
    { content: "The application crashes when uploading large files.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "URGENT", category: "Performance", themes: ["Performance"], rating: 1 },
    { content: "The pricing page is confusing.", source: "SURVEY", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "UX/Design", themes: ["UX/Design", "Features"], rating: 2 },
    { content: "The search feature is extremely useful.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features"], rating: 4 },
    { content: "Mobile app is very slow to load.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Mobile", themes: ["Mobile", "Performance"], rating: 2 },
    { content: "Love the new onboarding flow!", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 5 },
    { content: "I can't find the export button.", source: "SUPPORT", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "UX/Design", themes: ["UX/Design", "Features"], rating: 2 },
    { content: "The billing system charged me twice.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "URGENT", category: "Checkout", themes: ["Checkout"], rating: 1 },
    { content: "Great customer support experience.", source: "SUPPORT", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Support", themes: ["Support"], rating: 5 },
    { content: "The new API is much faster.", source: "APP_REVIEW", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "API/Integration", themes: ["API/Integration", "Performance"], rating: 4 },
    { content: "Two-factor authentication is confusing.", source: "SUPPORT", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "Security", themes: ["Security", "UX/Design"], rating: 2 },
    { content: "The dark mode looks fantastic.", source: "APP_REVIEW", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "UX/Design", themes: ["UX/Design", "Mobile"], rating: 5 },
    { content: "Export to PDF feature doesn't work.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Features", themes: ["Features"], rating: 1 },
    { content: "Customer dashboard is very intuitive.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 4 },
    { content: "The recent update broke my saved filters.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Features", themes: ["Features"], rating: 2 },
    { content: "Excellent documentation for developers.", source: "APP_REVIEW", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "API/Integration", themes: ["API/Integration"], rating: 5 },
    { content: "The team collaboration features are missing.", source: "SURVEY", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 2 },
    { content: "Login page is too slow.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Performance", themes: ["Performance"], rating: 2 },
    { content: "Love the new notification system.", source: "APP_REVIEW", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features", "Mobile"], rating: 4 },
    { content: "The mobile app crashes frequently.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "REVIEWED", priority: "URGENT", category: "Mobile", themes: ["Mobile", "Performance"], rating: 1 },
    { content: "Search results are irrelevant.", source: "SUPPORT", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features", "Performance"], rating: 2 },
    { content: "Pricing tiers are not transparent.", source: "SURVEY", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "Checkout", themes: ["Checkout", "UX/Design"], rating: 2 },
    { content: "The onboarding tutorial is very helpful.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 4 },
    { content: "I want to be able to integrate with Slack.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features", "API/Integration"], rating: 3 },
    { content: "The CSV export has wrong formatting.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Features", themes: ["Features"], rating: 2 },
    { content: "The UI is confusing and hard to navigate.", source: "SURVEY", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "UX/Design", themes: ["UX/Design"], rating: 2 },
    { content: "Great product, would recommend to others.", source: "APP_REVIEW", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Support", themes: ["Support"], rating: 5 },
    { content: "The loading spinner appears too often.", source: "SUPPORT", sentiment: "NEGATIVE", status: "NEW", priority: "LOW", category: "Performance", themes: ["Performance"], rating: 3 },
    { content: "Performance has improved significantly since last update.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Performance", themes: ["Performance"], rating: 4 },
    { content: "I need more customization options.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 3 },
    { content: "The email notifications are too frequent.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features"], rating: 3 },
    { content: "Billing page doesn't show invoice history.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Checkout", themes: ["Checkout", "Features"], rating: 2 },
    { content: "Love the real-time collaboration features.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features"], rating: 5 },
    { content: "The search filter needs more options.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 3 },
    { content: "App crashes on Android 14.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "REVIEWED", priority: "URGENT", category: "Mobile", themes: ["Mobile"], rating: 1 },
    { content: "The dashboard loads very slowly on mobile.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "NEW", priority: "HIGH", category: "Mobile", themes: ["Mobile", "Performance"], rating: 2 },
    { content: "Customer support response time has improved.", source: "SUPPORT", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Support", themes: ["Support"], rating: 4 },
    { content: "I can't upload files larger than 10MB.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 2 },
    { content: "The new design is much cleaner.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 4 },
    { content: "Two-factor auth via SMS is unreliable.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Security", themes: ["Security", "Mobile"], rating: 2 },
    { content: "The API documentation is outdated.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "API/Integration", themes: ["API/Integration"], rating: 2 },
    { content: "Feature request: dark mode for the mobile app.", source: "APP_REVIEW", sentiment: "NEUTRAL", status: "NEW", priority: "LOW", category: "Features", themes: ["Features", "Mobile"], rating: 3 },
    { content: "The pricing changed without notice.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Checkout", themes: ["Checkout"], rating: 1 },
    { content: "The onboarding process took too long.", source: "SURVEY", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "UX/Design", themes: ["UX/Design"], rating: 2 },
    { content: "Love the new team features!", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features"], rating: 5 },
    { content: "Export to Excel is broken.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Features", themes: ["Features"], rating: 1 },
    { content: "The app is very intuitive to use.", source: "APP_REVIEW", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "UX/Design", themes: ["UX/Design", "Mobile"], rating: 5 },
    { content: "I keep getting logged out unexpectedly.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Security", themes: ["Security"], rating: 1 },
    { content: "The webhook integration doesn't work.", source: "SUPPORT", sentiment: "NEGATIVE", status: "NEW", priority: "HIGH", category: "API/Integration", themes: ["API/Integration"], rating: 2 },
    { content: "Navigation between pages is slow.", source: "SUPPORT", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "Performance", themes: ["Performance", "UX/Design"], rating: 2 },
    { content: "The feedback form is too long.", source: "SURVEY", sentiment: "NEGATIVE", status: "REVIEWED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 3 },
    { content: "Data export is exactly what I needed.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features"], rating: 5 },
    { content: "The new notification center is confusing.", source: "SUPPORT", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "UX/Design", themes: ["UX/Design", "Features"], rating: 2 },
    { content: "Love the analytics dashboard!", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features"], rating: 5 },
    { content: "The mobile experience needs improvement.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "Mobile", themes: ["Mobile"], rating: 2 },
    { content: "API rate limiting is too strict.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "API/Integration", themes: ["API/Integration"], rating: 2 },
    { content: "The template system is very useful.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features"], rating: 4 },
    { content: "I can't find my billing information.", source: "SUPPORT", sentiment: "NEGATIVE", status: "NEW", priority: "HIGH", category: "Checkout", themes: ["Checkout"], rating: 1 },
    { content: "The search is way too slow.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Performance", themes: ["Performance"], rating: 1 },
    { content: "Great improvement in load times!", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Performance", themes: ["Performance"], rating: 5 },
    { content: "The new user roles are helpful.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features", "Security"], rating: 4 },
    { content: "CSV import doesn't handle special characters.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 2 },
    { content: "The mobile app doesn't support landscape mode.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "NEW", priority: "LOW", category: "Mobile", themes: ["Mobile"], rating: 3 },
    { content: "Love the new design system!", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 5 },
    { content: "The import feature takes too long.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "Performance", themes: ["Performance", "Features"], rating: 2 },
    { content: "Session timeout is too aggressive.", source: "SUPPORT", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "Security", themes: ["Security", "UX/Design"], rating: 2 },
    { content: "The team management page is confusing.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "UX/Design", themes: ["UX/Design"], rating: 2 },
    { content: "The reporting features are very powerful.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features"], rating: 4 },
    { content: "I can't connect my Google account.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "API/Integration", themes: ["API/Integration", "Security"], rating: 2 },
    { content: "The progress tracking is excellent.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features"], rating: 5 },
    { content: "Need better error messages.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "UX/Design", themes: ["UX/Design"], rating: 3 },
    { content: "The dashboard widgets are not customizable.", source: "SURVEY", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 2 },
    { content: "Love the new API endpoints!", source: "APP_REVIEW", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "API/Integration", themes: ["API/Integration"], rating: 5 },
    { content: "The mobile keyboard covers input fields.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Mobile", themes: ["Mobile", "UX/Design"], rating: 2 },
    { content: "The app works great on Chrome.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Performance", themes: ["Performance"], rating: 4 },
    { content: "Import from Salesforce doesn't work.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "API/Integration", themes: ["API/Integration"], rating: 1 },
    { content: "The pricing comparison page is helpful.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Checkout", themes: ["Checkout", "UX/Design"], rating: 4 },
    { content: "Need better search autocomplete.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 3 },
    { content: "The export feature is exactly what I needed.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features"], rating: 5 },
    { content: "The onboarding flow is too long.", source: "SURVEY", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "UX/Design", themes: ["UX/Design"], rating: 2 },
    { content: "Love the new color scheme!", source: "APP_REVIEW", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "UX/Design", themes: ["UX/Design", "Mobile"], rating: 4 },
    { content: "The mobile experience is frustrating.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Mobile", themes: ["Mobile"], rating: 2 },
    { content: "API docs are missing examples.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "API/Integration", themes: ["API/Integration"], rating: 2 },
    { content: "The notification preferences are limited.", source: "SURVEY", sentiment: "NEGATIVE", status: "NEW", priority: "LOW", category: "Features", themes: ["Features"], rating: 3 },
    { content: "Dashboard loads in under 2 seconds.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Performance", themes: ["Performance"], rating: 4 },
    { content: "The new bulk operations are useful.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features"], rating: 4 },
    { content: "Cannot delete old reports.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 2 },
    { content: "The user profile page is basic.", source: "SURVEY", sentiment: "NEGATIVE", status: "NEW", priority: "LOW", category: "UX/Design", themes: ["UX/Design", "Features"], rating: 3 },
    { content: "Love the keyboard shortcuts!", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 5 },
    { content: "The mobile app drains battery fast.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "Mobile", themes: ["Mobile", "Performance"], rating: 2 },
    { content: "The search needs fuzzy matching.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 3 },
    { content: "The theme customization is limited.", source: "SURVEY", sentiment: "NEGATIVE", status: "REVIEWED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 3 },
    { content: "Great progress on the mobile app!", source: "APP_REVIEW", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Mobile", themes: ["Mobile"], rating: 4 },
    { content: "The API versioning is confusing.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "API/Integration", themes: ["API/Integration"], rating: 2 },
    { content: "The billing cycle is unclear.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "Checkout", themes: ["Checkout"], rating: 2 },
    { content: "The audit log feature is missing.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features", "Security"], rating: 3 },
    { content: "Love the new integrations!", source: "APP_REVIEW", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "API/Integration", themes: ["API/Integration"], rating: 5 },
    { content: "The import supports CSV but not JSON.", source: "SUPPORT", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "API/Integration", themes: ["API/Integration", "Features"], rating: 2 },
    { content: "The dashboard is very informative.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 4 },
    { content: "The mobile app needs offline support.", source: "APP_REVIEW", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Mobile", themes: ["Mobile", "Features"], rating: 3 },
    { content: "Team collaboration needs improvement.", source: "SURVEY", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 2 },
    { content: "The data visualization is excellent.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features"], rating: 5 },
    { content: "API response times have improved.", source: "APP_REVIEW", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "API/Integration", themes: ["API/Integration", "Performance"], rating: 4 },
    { content: "The new scheduling feature is great.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features"], rating: 4 },
    { content: "Webhook payload is too large.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "MEDIUM", category: "API/Integration", themes: ["API/Integration"], rating: 2 },
    { content: "The onboarding checklist is helpful.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 4 },
    { content: "Love the recent performance updates!", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Performance", themes: ["Performance"], rating: 5 },
    { content: "The mobile app needs better error handling.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "Mobile", themes: ["Mobile"], rating: 2 },
    { content: "Search is not finding recent items.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Features", themes: ["Features", "Performance"], rating: 2 },
    { content: "The report templates are useful.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features"], rating: 4 },
    { content: "Need better notification controls.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 3 },
    { content: "The API needs batch endpoints.", source: "APP_REVIEW", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "API/Integration", themes: ["API/Integration"], rating: 3 },
    { content: "Mobile login is broken on iOS.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "REVIEWED", priority: "URGENT", category: "Mobile", themes: ["Mobile", "Security"], rating: 1 },
    { content: "The dashboard shows real-time data.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features", "Performance"], rating: 5 },
    { content: "Love the new export options!", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features"], rating: 4 },
    { content: "The pricing page needs a comparison table.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Checkout", themes: ["Checkout", "UX/Design"], rating: 3 },
    { content: "The mobile UI needs more polish.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "Mobile", themes: ["Mobile", "UX/Design"], rating: 2 },
    { content: "The team invites are not working.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Features", themes: ["Features"], rating: 1 },
    { content: "The API supports GraphQL now.", source: "APP_REVIEW", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "API/Integration", themes: ["API/Integration"], rating: 4 },
    { content: "The new analytics are very insightful.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features"], rating: 5 },
    { content: "The mobile app needs push notifications.", source: "APP_REVIEW", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Mobile", themes: ["Mobile", "Features"], rating: 3 },
    { content: "The search needs date range filters.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 3 },
    { content: "The report export is very slow.", source: "SUPPORT", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Performance", themes: ["Performance", "Features"], rating: 2 },
    { content: "Love the new admin dashboard!", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "UX/Design", themes: ["UX/Design", "Features"], rating: 5 },
    { content: "The mobile app needs better accessibility.", source: "APP_REVIEW", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Mobile", themes: ["Mobile", "UX/Design"], rating: 3 },
    { content: "The API has great documentation now.", source: "APP_REVIEW", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "API/Integration", themes: ["API/Integration"], rating: 5 },
    { content: "The import handles large files well.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features", "Performance"], rating: 4 },
    { content: "The dashboard color scheme is professional.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 4 },
    { content: "Need better mobile navigation.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "NEW", priority: "MEDIUM", category: "Mobile", themes: ["Mobile", "UX/Design"], rating: 2 },
    { content: "The search needs relevance scoring.", source: "SURVEY", sentiment: "NEUTRAL", status: "NEW", priority: "MEDIUM", category: "Features", themes: ["Features"], rating: 3 },
    { content: "The report scheduler is excellent.", source: "SURVEY", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "Features", themes: ["Features"], rating: 5 },
    { content: "Love the new team workspace!", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "Features", themes: ["Features"], rating: 5 },
    { content: "The mobile app needs better performance.", source: "APP_REVIEW", sentiment: "NEGATIVE", status: "REVIEWED", priority: "HIGH", category: "Mobile", themes: ["Mobile", "Performance"], rating: 2 },
    { content: "The API supports webhooks now.", source: "APP_REVIEW", sentiment: "POSITIVE", status: "REVIEWED", priority: "LOW", category: "API/Integration", themes: ["API/Integration"], rating: 4 },
    { content: "The onboarding video is very helpful.", source: "SURVEY", sentiment: "POSITIVE", status: "RESOLVED", priority: "LOW", category: "UX/Design", themes: ["UX/Design"], rating: 4 },
  ];

  const createdFeedback: Array<{ id: string; content: string; sentiment: string }> = [];

  for (let i = 0; i < feedbackItems.length; i++) {
    const item = feedbackItems[i];
    const nameIdx = i % customerNames.length;

    const fb = await prisma.feedback.create({
      data: {
        content: item.content,
        source: item.source,
        sentiment: item.sentiment,
        status: item.status,
        priority: item.priority,
        category: item.category,
        customerName: customerNames[nameIdx],
        customerEmail: customerEmails[nameIdx],
        workspaceId: workspace.id,
        createdAt: randomDate(90),
      },
    });
    createdFeedback.push(fb);
  }

  console.log(`Created ${createdFeedback.length} feedback items.`);

  const themeAssociations: Array<{ feedbackId: string; themeId: string }> = [];

  for (let i = 0; i < feedbackItems.length; i++) {
    const fb = createdFeedback[i];
    const item = feedbackItems[i];
    const assignedThemeIds = item.themes.map((name) => themeMap[name]);

    for (const themeId of assignedThemeIds) {
      themeAssociations.push({ feedbackId: fb.id, themeId });
    }
  }

  await prisma.feedbackTheme.createMany({
    data: themeAssociations,
    skipDuplicates: true,
  });

  console.log(`Created ${themeAssociations.length} feedback-theme associations.`);

  const themeCounts = await prisma.feedbackTheme.groupBy({
    by: ["themeId"],
    _count: { feedbackId: true },
  });

  for (const tc of themeCounts) {
    const positive = createdFeedback.filter(
      (fb) =>
        fb.sentiment === "POSITIVE" &&
        themeAssociations.some((a) => a.feedbackId === fb.id && a.themeId === tc.themeId)
    ).length;

    const negative = createdFeedback.filter(
      (fb) =>
        fb.sentiment === "NEGATIVE" &&
        themeAssociations.some((a) => a.feedbackId === fb.id && a.themeId === tc.themeId)
    ).length;

    const trendScore = (positive - negative) / Math.max(tc._count.feedbackId, 1);

    await prisma.theme.update({
      where: { id: tc.themeId },
      data: {
        feedbackCount: tc._count.feedbackId,
        positiveCount: positive,
        negativeCount: negative,
        trendScore: parseFloat(trendScore.toFixed(2)),
      },
    });
  }

  console.log("Theme counts and sentiment breakdowns updated.");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
