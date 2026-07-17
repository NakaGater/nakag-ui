import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "Components/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-90">
      <CardHeader>
        <CardTitle>プロジェクトを作成</CardTitle>
        <CardDescription>ワンクリックでデプロイできます。</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            閉じる
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">カードのコンテンツ領域です。</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button>デプロイ</Button>
        <Button variant="outline">キャンセル</Button>
      </CardFooter>
    </Card>
  ),
};
