import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatRooms } from "@/components/communication/ChatRooms";
import { ChatRoomAutoAdd } from "@/components/communication/ChatRoomAutoAdd";
import { WalkieTalkie } from "@/components/communication/WalkieTalkie";
import { MessageCircle, Radio } from "lucide-react";

const Communication = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50 fixed left-0 right-0 top-0 bottom-0 overflow-y-auto">
      <div className="w-full px-0 max-w-none sm:max-w-4xl sm:mx-auto">
        {/* Componente invisible que auto-agrega miembros a sala General */}
        <ChatRoomAutoAdd />

        {/* Header similar a WhatsApp */}
        <div className="bg-arcana-blue-gradient px-4 py-3 sm:py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Mensajes ARCANA</h1>
                <p className="text-white/80 text-xs sm:text-sm">Comunicación del ministerio</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-white px-4 py-2 border-b">
            <TabsTrigger
              value="chat"
              className="flex items-center gap-2 text-sm data-[state=active]:text-arcana-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-arcana-blue-600 rounded-none"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger
              value="walkie"
              className="flex items-center gap-2 text-sm data-[state=active]:text-arcana-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-arcana-blue-600 rounded-none"
            >
              <Radio className="w-4 h-4" />
              <span>Walkie</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="m-0">
            <Card className="border-0 shadow-none rounded-none">
              <CardContent className="p-0">
                <ChatRooms />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="walkie" className="m-0">
            <Card className="border-0 shadow-none rounded-none">
              <CardContent className="p-0">
                <WalkieTalkie />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Communication;
