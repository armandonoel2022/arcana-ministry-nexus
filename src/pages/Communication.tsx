import { CommunicationHub } from "@/components/communication/CommunicationHub";

const Communication = () => {
  return (
    <div className="w-full min-h-screen bg-background fixed left-0 right-0 top-0 bottom-0 overflow-y-auto">
      <CommunicationHub />
    </div>
  );
};

export default Communication;
