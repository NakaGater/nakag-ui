import { Button, Card, CardContent, cn } from "@nakagater/ui";

export function Good({ active }: { active: boolean }) {
  return (
    <Card className="w-96">
      <CardContent className={cn("flex gap-3", active ? "bg-muted" : "bg-background")}>
        <Button variant="destructive">削除</Button>
        <Button size="icon" aria-label="追加">
          <svg aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  );
}
