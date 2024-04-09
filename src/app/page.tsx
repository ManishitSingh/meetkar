"use client";
import { socket } from "@/socket";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [details,setDetails] = useState({
    name: "",
    roomId: "",
  })
  const handleSubmit = ()=>{
    if(details.name && details.roomId){
      socket.emit("joinRoom",{name:details.name,roomId:details.roomId});
    }
  }
  
  useEffect(()=>{
    socket.on("connect",()=>{
      console.log("connected");
    });

    socket.on("created",({roomId})=>{
      console.log("created",roomId);
      if(roomId){
        router.push(`/room/${roomId}`);
      }
    });

    socket.on("joined",({roomId})=>{
      console.log("joined",roomId);
      if(roomId){
        router.push(`/room/${roomId}`);
      }
    });

    socket.on("error",(err)=>{
      console.log(err);
    
    return ()=>{
      socket.off("connect");
      socket.off("error");
      socket.off("created");
      socket.off("joined");
    }

  })

  },[router]);

  return (
    <>
      <div
        className="flex flex-col  h-screen w-screen   p-4"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 252, 0, 1) 0%, rgba(240, 237, 23, 1) 100%)",
        }}
      >
        <div className="  flex justify-center ">
          <h1
            className=" "
            style={{
              margin: 0,
              fontSize: "8em",
              padding: 0,
              color: "white",
              textShadow:
                "0 0.1em 20px rgba(0, 0, 0, 1), 0.05em -0.03em 0 rgba(0, 0, 0, 1), 0.05em 0.005em 0 rgba(0, 0, 0, 1), 0em 0.08em 0 rgba(0, 0, 0, 1), 0.05em 0.08em 0 rgba(0, 0, 0, 1), 0px -0.03em 0 rgba(0, 0, 0, 1), -0.03em -0.03em 0 rgba(0, 0, 0, 1), -0.03em 0.08em 0 rgba(0, 0, 0, 1), -0.03em 0 0 rgba(0, 0, 0, 1)",
            }}
          >
            <span
              style={{
                transform: "scale(0.9)",
                display: "inline-block",
                animation:
                  "bop 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards infinite alternate",
              }}
            >
              &quot;MEET
            </span>
            <span
              style={{
                transform: "scale(0.9)",
                display: "inline-block",
                animation:
                  "bopB 1s 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards infinite alternate",
              }}
            >
              KAR&quot;
            </span>
          </h1>
        </div>

        <div className="h-full text-white  flex justify-center ">
          <div className=" sm:m-auto h-[250px] flex flex-col justify-center border border-black bg-gray-900  rounded-xl w-[350px] p-12  gap-4 ">
            <div className=" text-black relative w-full min-w-[200px] h-10 ">
              <input
                type="text"
                className="w-full h-full  border-2 border-black rounded-lg p-2"
                placeholder="Enter your name"
                onChange={(e) =>
                  setDetails((prevDetails) => ({
                    ...prevDetails,
                    name: e.target.value,
                  }))
                }
                value={details.name}
              />
            </div>
            <div className=" text-black relative w-full min-w-[200px] h-10 ">
              <input
                type="text"
                className="w-full h-full  border-2 border-black rounded-lg p-2"
                placeholder="Enter your roomId"
                onChange={(e) =>
                  setDetails((prevDetails) => ({
                    ...prevDetails,
                    roomId: e.target.value,
                  }))
                }
                value={details.roomId}
              />
            </div>
            <button className="w-full h-10 bg-yellow-400 rounded-lg border-2 border-black" onClick={handleSubmit} >
              <h1>Join</h1>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
