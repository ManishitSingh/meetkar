"use client";
import { socket } from "@/socket";
import { useCallback, useEffect, useState } from "react";

const Room = ({ params }: { params: string }) => {
  const [remoteUser, setRemoteUser] = useState<string | null>(null);

  const handleNewUser = useCallback(
    ({ name, id }: { name: string; id: string }) => {
      console.log("new user joined: ", name);
      setRemoteUser(id);
    },
    []
  );

  useEffect(() => {
    socket.on("joined-user", handleNewUser);

    return () => {
      socket.off("joined-user", handleNewUser);
    };
  }, [handleNewUser]);

  return (
    <div className="bg-black h-screen w-screen text-white p-4">
      <h1>hello</h1>
    </div>
  );
};

export default Room;
