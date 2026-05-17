import tempfile
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse

from app.api.deps import (
    get_chat_service,
    get_dump_analysis_service,
    get_obfuscation_service,
    get_pcap_analysis_service,
    get_upload_service,
)
from app.schemas.analysis import DumpAnalysisRequest, PcapAnalysisRequest
from app.schemas.chat import AnalysisResponse, ChatMessageResponse, FollowUpRequest
from app.schemas.files import (
    BulkFileActionRequest,
    FileDescriptionUpdate,
    FileMetadataResponse,
    ObfuscationMappingResponse,
)
from app.schemas.common import MessageResponse
from app.services.chat_service import ChatService
from app.services.dump_analysis_service import DumpAnalysisService
from app.services.ip_obfuscation_service import IpObfuscationService
from app.services.pcap_analysis_service import PcapAnalysisService
from app.services.pcap_upload_service import PcapUploadService

router = APIRouter(prefix="/packet", tags=["packet-analysis"])


@router.post("/files", response_model=list[FileMetadataResponse])
async def upload_files(
    files: list[UploadFile] = File(...),
    service: PcapUploadService = Depends(get_upload_service),
):
    return await service.save_uploads(files)


@router.get("/files", response_model=list[FileMetadataResponse])
async def list_files(service: PcapUploadService = Depends(get_upload_service)):
    return service.list_files()


@router.patch("/files/{file_id}", response_model=FileMetadataResponse)
async def update_file_description(
    file_id: str,
    payload: FileDescriptionUpdate,
    service: PcapUploadService = Depends(get_upload_service),
):
    return service.update_description(file_id, payload.description)


@router.get("/files/{file_id}/download")
async def download_file(file_id: str, service: PcapUploadService = Depends(get_upload_service)):
    metadata, path = service.get_file_path(file_id)
    return FileResponse(path, filename=metadata.filename, media_type="application/octet-stream")


@router.post("/files/download")
async def download_files(
    payload: BulkFileActionRequest,
    service: PcapUploadService = Depends(get_upload_service),
):
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    tmp.close()
    with zipfile.ZipFile(tmp.name, "w", zipfile.ZIP_DEFLATED) as archive:
        for file_id in payload.file_ids:
            metadata, path = service.get_file_path(file_id)
            archive.write(path, arcname=metadata.filename)
    return FileResponse(Path(tmp.name), filename="pcap_files.zip", media_type="application/zip")


@router.delete("/files/{file_id}", response_model=list[FileMetadataResponse])
async def delete_file(file_id: str, service: PcapUploadService = Depends(get_upload_service)):
    return service.delete_files([file_id])


@router.delete("/files", response_model=list[FileMetadataResponse])
async def delete_files(
    payload: BulkFileActionRequest,
    service: PcapUploadService = Depends(get_upload_service),
):
    return service.delete_files(payload.file_ids)


@router.post("/files/obfuscate", response_model=list[FileMetadataResponse])
async def obfuscate_files(
    payload: BulkFileActionRequest,
    service: IpObfuscationService = Depends(get_obfuscation_service),
):
    return service.obfuscate_files(payload.file_ids)


@router.get("/files/{file_id}/obfuscation-map", response_model=list[ObfuscationMappingResponse])
async def get_obfuscation_map(
    file_id: str,
    service: IpObfuscationService = Depends(get_obfuscation_service),
):
    return service.list_mapping(file_id)


@router.post("/analyze/pcap", response_model=AnalysisResponse)
async def analyze_pcap(
    payload: PcapAnalysisRequest,
    pcap_service: PcapAnalysisService = Depends(get_pcap_analysis_service),
    chat_service: ChatService = Depends(get_chat_service),
):
    context = pcap_service.build_context(
        payload.file_ids,
        payload.source_ip,
        payload.destination_ip,
        payload.extra_message,
    )
    session_id, answer, messages = chat_service.start_analysis("pcap", context)
    return {"session_id": session_id, "answer": answer, "messages": messages}


@router.post("/analyze/dump", response_model=AnalysisResponse)
async def analyze_dump(
    payload: DumpAnalysisRequest,
    dump_service: DumpAnalysisService = Depends(get_dump_analysis_service),
    chat_service: ChatService = Depends(get_chat_service),
):
    context = dump_service.build_context(
        payload.dump_text,
        payload.source_ip,
        payload.destination_ip,
        payload.extra_message,
    )
    session_id, answer, messages = chat_service.start_analysis("dump", context)
    return {"session_id": session_id, "answer": answer, "messages": messages}


@router.post("/chat/{session_id}/messages", response_model=AnalysisResponse)
async def follow_up(
    session_id: str,
    payload: FollowUpRequest,
    chat_service: ChatService = Depends(get_chat_service),
):
    answer, messages = chat_service.follow_up(session_id, payload.message)
    return {"session_id": session_id, "answer": answer, "messages": messages}


@router.get("/chat/{session_id}/messages", response_model=list[ChatMessageResponse])
async def list_messages(
    session_id: str,
    chat_service: ChatService = Depends(get_chat_service),
):
    return chat_service.list_messages(session_id)


@router.get("/version", response_model=MessageResponse)
async def version() -> dict[str, str]:
    return {"message": "packet-analysis-v1"}
