
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatRooms } from "@/components/communication/ChatRooms";
import { WalkieTalkie } from "@/components/communication/WalkieTalkie";
import { MessageCircle, Radio } from "lucide-react";

const Communication = () => {
  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="text-center space-y-1 sm:space-y-2 px-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          Centro de Comunicación
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          Mantente conectado con tu equipo a través de chats grupales y walkie-talkie
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Chats Grupales</span>
            <span className="sm:hidden">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="walkie" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Radio className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Walkie-Talkie</span>
            <span className="sm:hidden">Walkie</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-arcana-blue-600" />
                Salas de Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChatRooms />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="walkie" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-arcana-gold-600" />
                Walkie-Talkie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WalkieTalkie />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Communication;
