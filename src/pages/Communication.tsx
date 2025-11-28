import { ChatRooms } from "@/components/communication/ChatRooms";
import { ChatRoomAutoAdd } from "@/components/communication/ChatRoomAutoAdd";
import { MessageCircle } from "lucide-react";

const Communication = () => {
  return (
    <div className="w-full min-h-screen bg-white fixed left-0 right-0 top-0 bottom-0 overflow-y-auto">
      <div className="w-full px-0 max-w-none sm:max-w-4xl sm:mx-auto">
        {/* Componente invisible que auto-agrega miembros a sala General */}
        <ChatRoomAutoAdd />

        {/* Header similar a WhatsApp */}
        <div className="bg-blue-600 px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Mensajes ARCANA</h1>
              <p className="text-white/80 text-sm">Comunicación del ministerio</p>
            </div>
          </div>
        </div>

        {/* Componente de salas de chat */}
        <ChatRooms />
      </div>
    </div>
  );
};

export default Communication;
