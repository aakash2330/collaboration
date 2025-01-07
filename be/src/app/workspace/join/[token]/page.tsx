import { Button } from "@/components/ui/button";
import { api } from "@/trpc/server";
import _ from "lodash";
import Form from "next/form";

export default async function JoinWorkspacePage({
  params,
}: {
  params: { token: string };
}) {
  const invitation = await api.workspace.getWorksheetDataByInvitationToken({
    token: params.token,
  });
  if (_.isEmpty(invitation)) {
    return <div>Couldn&apos;t find invitation</div>;
  }
  return (
    <div>
      <div>
        Are you sure you want to join workspace{" "}
        {_.get(invitation, ["data", "workspace", "name"], null)}
      </div>
      <Form
        action={async () => {
          "use server";
          const res = await api.workspace.acceptWorkspaceInvitation({
            token: params.token,
          });
          if (!_.get(res, ["data", "success"], false)) {
            console.log("unable to join workspace");
          }
          console.log("workspace joined successfully");
        }}
      >
        <Button type="submit">Yes</Button>
      </Form>
    </div>
  );
}
