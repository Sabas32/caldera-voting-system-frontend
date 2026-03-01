"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";

type CandidateResult = {
  name: string;
  votes: number;
  percentage: number;
  is_tied_leader: boolean;
};

export function ResultsCandidatesTable({
  candidates,
  tieDetected,
}: {
  candidates: CandidateResult[];
  tieDetected: boolean;
}) {
  const rankedCandidates = candidates.reduce<Array<{ candidate: CandidateResult; rank: number; index: number; id: string }>>((acc, candidate, index) => {
    const previous = acc[index - 1];
    const rank = previous && previous.candidate.votes === candidate.votes ? previous.rank : index + 1;
    acc.push({ candidate, rank, index, id: `${candidate.name}-${index}` });
    return acc;
  }, []);

  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_74%,var(--surface-2))]">
      <div className="max-h-72 overflow-auto">
        <Table>
          <thead className="sticky top-0 z-10 bg-[var(--surface)]">
            <tr>
              <TableHead>Rank</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Votes</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>Status</TableHead>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-[var(--muted-text)]">
                  No candidates found for this post.
                </TableCell>
              </TableRow>
            ) : null}
            {rankedCandidates.map((item) => {
              const { candidate, rank, index, id } = item;
              return (
                <TableRow key={id}>
                  <TableCell className="font-medium">{rank}</TableCell>
                  <TableCell>{candidate.name}</TableCell>
                  <TableCell>{candidate.votes.toLocaleString()}</TableCell>
                  <TableCell>{candidate.percentage.toFixed(2)}%</TableCell>
                  <TableCell>
                    {candidate.is_tied_leader ? (
                      <Badge className="border-[color-mix(in_oklab,var(--warning)_55%,var(--edge))]">Tied leader</Badge>
                    ) : !tieDetected && index === 0 ? (
                      <Badge className="border-[color-mix(in_oklab,var(--success)_55%,var(--edge))]">Leader</Badge>
                    ) : (
                      <span className="small text-[var(--muted-text)]">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
