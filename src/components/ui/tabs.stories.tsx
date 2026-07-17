import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">アカウント</TabsTrigger>
        <TabsTrigger value="password">パスワード</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-muted-foreground text-sm">
          アカウント設定のコンテンツ。
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-muted-foreground text-sm">
          パスワード変更のコンテンツ。
        </p>
      </TabsContent>
    </Tabs>
  ),
};
