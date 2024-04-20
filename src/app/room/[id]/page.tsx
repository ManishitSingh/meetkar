"use client";
import { socket } from "@/socket";
import { useCallback, useEffect, useState } from "react";
import Peer from "@/service/Peer";

const Room = ({ params }: { params: {id:string} }) => {

  const [remoteUser, setRemoteUser] = useState<string | null>(null);
  const [startBtnState, setStartBtnState] = useState<boolean>(false);
  console.log("Peer",Peer);
  

  const handleNewUser = useCallback(
    ({ name, id }: { name: string; id: string }) => {
      console.log("new user joined: ", name);
      setRemoteUser(id);
      console.log("remote user: ", id);
    },
    []
  );
  const handleOtherUser = useCallback(({id}:{id:string})=>{
      console.log("other user joined: ",id);
      if(id) setRemoteUser(id);
  },[])

  useEffect(() => {
    socket.on("joined-user", handleNewUser);
    socket.emit("other-user-id",{roomId:params.id});
    socket.on("other-id",handleOtherUser);
    socket.on("offer",({offer,from})=>{
      console.log("offer received from: ",from);
      console.log(offer);
    })

    return () => {
      socket.off("joined-user", handleNewUser);
      socket.off("other-user",handleOtherUser);
    };
  }, [handleNewUser,handleOtherUser,params.id]);

  return (
    <div className="bg-black h-screen w-screen text-white p-4">
      <div className="flex flex-col w-full h-full">
        <div className="flex min-h-[400px] gap-4 justify-center">
            <div className="basis-1/2 border h-3/4 my-auto"></div>
            <div className="basis-1/2 border h-3/4 my-auto"></div>
        </div>

        <div className="flex gap-5  justify-center text-red-500">
          <button
            onClick={async() => {
              const offer = await Peer.getOffer();
              Peer.setLocalDescription(offer);
              socket.emit("offer", { offer,to:remoteUser });

            }}
          >
            Start
          </button>
          <button>Stop</button>
          {remoteUser && <p>Remote User: {remoteUser}</p>}
        </div>
      </div>
    </div>
  );
};

export default Room;
