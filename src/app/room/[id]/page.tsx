"use client";
import { socket } from "@/socket";
import { useCallback, useEffect, useState } from "react";
import Peer from "@/service/Peer";
import ReactPlayer from "react-player";

const Room = ({ params }: { params: { id: string } }) => {
  const [remoteUser, setRemoteUser] = useState<string | null>(null);
  const [callNotification, setCallNotification] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDetails, setCallDetails] = useState<any>(null);
  const [didOffer, setDidOffer] = useState<boolean>(false);

  const handleNewUser = useCallback(
    ({ name, id }: { name: string; id: string }) => {
      console.log("new user joined: ", name);
      setRemoteUser(id);
      console.log("remote user: ", id);
    },
    []
  );
  const handleOtherUser = useCallback(({ id }: { id: string }) => {
    console.log("other user joined: ", id);
    if (id) setRemoteUser(id);
  }, []);

  const sendStream = useCallback(async () => {
    if (!localStream) return;
    console.log("Sending Stream");
    for (const track of localStream.getTracks()) {
      Peer.peer?.addTrack(track, localStream);
    }
  }, [localStream]);

  let isNegotiating = false;

  const handleNego = useCallback(async () => {
    console.log("Negotiating");
    // Check if negotiation is already in progress
    if (isNegotiating) {
      console.log(
        "Negotiation is already in progress. Skipping offer generation."
      );
      return;
    }

    // Set the flag to true to indicate that negotiation is now in progress
    isNegotiating = true;

    try {
      const offer = await Peer.getOffer();
      socket.emit("nego-start", { offer, to: remoteUser });
    } catch (error) {
      console.error("Error generating offer:", error);
    } finally {
      isNegotiating = false;
    }
  }, []);

  const handleNegoAnswer = useCallback(async ({ offer, from }: any) => {
    console.log("Nego from", from, offer);
    const ans = await Peer.getAnswer(offer);
    socket.emit("nego-done", { ans, to: from });
  }, []);

  const handleNegoFinal = useCallback(async ({ ans }: any) => {
    await Peer.setLocalDescription(ans);
    console.log("Nego Final", ans);
  }, []);

  useEffect(() => {
    socket.on("joined-user", handleNewUser);
    socket.emit("other-user-id", { roomId: params.id });
    socket.on("other-id", handleOtherUser);

    socket.on("offer", async ({ offer, from }) => {
      
      setCallNotification(true);
      setCallDetails({ offer, from });

      // const stream = await navigator.mediaDevices.getUserMedia({
      //   video: true,
      //   audio: true,
      // });
      // setLocalStream(stream);
      // console.log("offer received from: ", from);
      // console.log(offer);
      // sendStream();
      // const answer = await Peer.getAnswer(offer);
      // socket.emit("answer", { answer, to: from });
      // console.log("local stream", localStream);
    });

    socket.on("answer", async ({ answer }) => {
      await Peer.setLocalDescription(answer);
      console.log(answer);
      console.log("answer received");

    });

    Peer.peer?.addEventListener("icecandidate", async (e) => {
      socket.emit("ice-candidate", { candidate: e.candidate, to: remoteUser });
    });

    Peer.peer?.addEventListener("negotiationneeded", handleNego);

    Peer.peer?.addEventListener("connectionstatechange", () => {
      console.log("connection state: ", Peer.peer?.connectionState);
      if (Peer.peer?.connectionState === "connected") {
        console.log("connected");
      }
    });

    Peer.peer?.addEventListener("track", (event) => {
      console.log("track received: ", event);
      setRemoteStream(event.streams[0]);
    });

    socket.on("nego-start", handleNegoAnswer);
    socket.on("nego-final", handleNegoFinal);

    socket.on("ice-candidate", async ({ candidate }: any) => {
      try {
        await Peer.peer?.addIceCandidate(candidate);
        console.log("ice candidate added");
      } catch (error) {
        console.error("Error adding ice candidate:", error);
      }
    });

    return () => {
      socket.off("joined-user", handleNewUser);
      socket.off("other-user", handleOtherUser);
      socket.off("offer");
      socket.off("answer");
      socket.off("nego-start", handleNegoAnswer);
      socket.off("nego-final", handleNegoFinal);
      socket.off("ice-candidate");
      Peer.peer?.removeEventListener("icecandidate", () => {});
      Peer.peer?.removeEventListener("negotiationneeded", () => {});
      Peer.peer?.removeEventListener("connectionstatechange", () => {});
    };
  }, [
    handleNewUser,
    handleOtherUser,
    params.id,
    sendStream,
    localStream,
    remoteUser,
    handleNego,
    handleNegoAnswer,
    handleNegoFinal,
  ]);

  return (
    <div className="bg-black h-screen w-screen text-white p-4">
      <div className="flex flex-col w-full h-full">
        <div className=" mx-auto min-w-[250px] rounded-md p-2">
          {callNotification && (
            <div className=" text-white p-2">
              <p>Call from: {remoteUser}</p>
              <div className="flex gap-2 justify-between px-12 my-2">
                <button
                  onClick={async () => {
                    const stream = await navigator.mediaDevices.getUserMedia({
                      video: true,
                      audio: true,
                    });
                    setLocalStream(stream);
                    console.log("local stream", localStream);
                    sendStream();
                    const answer = await Peer.getAnswer(callDetails.offer);
                    socket.emit("answer", { answer, to: remoteUser });

                    // setTimeout(async () => {
                    //   const offer = await Peer.getOffer();
                    //   socket.emit("offer", { offer, to: remoteUser });
                    // }, 1000);

                    setCallNotification(false);
                  }}
                  className="bg-green-500 px-2 py-1 rounded-md"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    setCallNotification(false);
                  }}
                  className="bg-red-500 px-2 py-1 rounded-md"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex min-h-[400px] gap-4 justify-center">
          <div className="basis-1/2 border h-3/4 my-auto">
            {localStream ? (
              <ReactPlayer
                url={localStream}
                playing
                width="100%"
                height="100%"
                controls
              />
            ) : (
              "No Stream"
            )}
          </div>
          <div className="basis-1/2 border h-3/4 my-auto">
            {remoteStream ? (
              <ReactPlayer
                url={remoteStream}
                playing
                width="100%"
                height="100%"
                controls
              />
            ) : (
              "No Stream"
            )}
          </div>
        </div>

        <div className="flex gap-5  justify-center text-red-500">
          <button
            onClick={async () => {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });
              setLocalStream(stream);
              sendStream();

              const offer = await Peer.getOffer();
              socket.emit("offer", { offer, to: remoteUser });
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
