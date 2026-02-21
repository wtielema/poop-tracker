import { getDashboardData } from "@/app/actions/feed";
import StreakCard from "@/components/home/StreakCard";
import QuickLogButton from "@/components/home/QuickLogButton";
import DailyFact from "@/components/home/DailyFact";
import FriendFeed from "@/components/home/FriendFeed";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning! \u2600\uFE0F";
  if (hour >= 12 && hour < 17) return "Good afternoon! \uD83C\uDF24\uFE0F";
  if (hour >= 17 && hour < 21) return "Good evening! \uD83C\uDF05";
  return "Late night! \uD83C\uDF19";
}

export default async function Home() {
  const data = await getDashboardData();

  return (
    <div className="max-w-md mx-auto px-6 py-4 space-y-6 animate-page-enter">
      <h1
        className="font-bold"
        style={{ fontSize: 24, color: "var(--foreground)" }}
      >
        {getGreeting()}
      </h1>

      <StreakCard streak={data.streak} loggedToday={data.loggedToday} />

      <QuickLogButton />

      <DailyFact fact={data.dailyFact} />

      <FriendFeed events={data.feedEvents} />
    </div>
  );
}
