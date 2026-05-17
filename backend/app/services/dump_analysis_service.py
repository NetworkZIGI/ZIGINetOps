class DumpAnalysisService:
    def build_context(
        self,
        dump_text: str,
        source_ip: str | None,
        destination_ip: str | None,
        extra_message: str | None,
    ) -> str:
        filters = []
        if source_ip:
            filters.append(f"source_ip={source_ip}")
        if destination_ip:
            filters.append(f"destination_ip={destination_ip}")
        extra = f"\nOperator notes:\n{extra_message}\n" if extra_message else ""
        return "\n".join(
            [
                "Analyze the following tcpdump output for network operations.",
                f"Filters: {', '.join(filters) if filters else 'none'}",
                "Tcpdump content:",
                dump_text.strip(),
                extra,
            ]
        )
