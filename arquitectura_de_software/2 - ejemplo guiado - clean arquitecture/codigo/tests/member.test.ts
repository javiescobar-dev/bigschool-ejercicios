import { describe, expect, test } from "bun:test";
import { memberId } from "@/domain/identifiers";
import { Member } from "@/domain/member";

describe("Member", () => {
  test("registers a loan without mutating the original member", () => {
    const member = Member.create({
      id: memberId("member-1"),
      membershipType: "standard",
    });

    const result = member.registerLoan();

    expect(result.ok).toBe(true);
    expect(member.activeLoanCount).toBe(0);
    if (result.ok) expect(result.member.activeLoanCount).toBe(1);
  });

  test("rejects suspended members", () => {
    const member = Member.create({
      id: memberId("member-1"),
      membershipType: "standard",
      suspended: true,
    });

    expect(member.registerLoan()).toEqual({
      ok: false,
      reason: "member_suspended",
    });
  });

  test("applies the limit associated with the membership", () => {
    const member = Member.create({
      id: memberId("member-1"),
      membershipType: "premium",
      activeLoanCount: 5,
    });

    expect(member.registerLoan()).toEqual({
      ok: false,
      reason: "loan_limit_reached",
    });
  });
});
