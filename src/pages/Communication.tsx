
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatRooms } from "@/components/communication/ChatRooms";
import { WalkieTalkie } from "@/components/communication/WalkieTalkie";
import { MessageCircle, Radio } from "lucide-react";

const Communication = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Centro de Comunicación
        </h1>
        <p className="text-gray-600">
          Mantente conectado con tu equipo a través de chats grupales y walkie-talkie
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Chats Grupales
          </TabsTrigger>
          <TabsTrigger value="walkie" className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Walkie-Talkie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-arcana-blue-600" />
                Salas de Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChatRooms />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="walkie" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-arcana-gold-600" />
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
