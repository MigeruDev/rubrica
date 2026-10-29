// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {CertificateRegistry} from "../src/CertificateRegistry.sol";

contract CertificateRegistryTest is Test {
    CertificateRegistry internal registry;

    address internal admin = makeAddr("admin");
    address internal issuer = makeAddr("issuer");
    address internal otherIssuer = makeAddr("otherIssuer");
    address internal student = makeAddr("student");
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant COURSE_A = keccak256("BLOCKCHAIN-2026");
    bytes32 internal constant COURSE_B = keccak256("SOLIDITY-2026");
    bytes32 internal constant HASH_A = keccak256("doc-a");
    bytes32 internal constant HASH_B = keccak256("doc-b");

    bytes32 internal ISSUER_ROLE;
    bytes32 internal DEFAULT_ADMIN_ROLE;

    event CertificateIssued(
        uint256 indexed id, address indexed student, bytes32 indexed courseId, address issuer, bytes32 documentHash
    );
    event CertificateRevoked(uint256 indexed id, address indexed revokedBy);

    function setUp() public {
        registry = new CertificateRegistry(admin);
        ISSUER_ROLE = registry.ISSUER_ROLE();
        DEFAULT_ADMIN_ROLE = registry.DEFAULT_ADMIN_ROLE();

        vm.startPrank(admin);
        registry.grantRole(ISSUER_ROLE, issuer);
        registry.grantRole(ISSUER_ROLE, otherIssuer);
        vm.stopPrank();
    }

    function _issue(address who, address to, bytes32 courseId, bytes32 hash) internal returns (uint256) {
        vm.prank(who);
        return registry.issueCertificate(to, courseId, hash);
    }

    // ---------------------------------------------------------------- constructor

    function test_constructor_setsAdmin() public view {
        assertTrue(registry.hasRole(DEFAULT_ADMIN_ROLE, admin));
        assertFalse(registry.hasRole(ISSUER_ROLE, admin));
        assertEq(registry.totalIssued(), 0);
    }

    function test_constructor_revertsZeroAdmin() public {
        vm.expectRevert(CertificateRegistry.ZeroAddress.selector);
        new CertificateRegistry(address(0));
    }

    // ---------------------------------------------------------------- issue

    function test_issue_happyPath() public {
        vm.warp(1_700_000_000);

        vm.expectEmit(true, true, true, true, address(registry));
        emit CertificateIssued(1, student, COURSE_A, issuer, HASH_A);

        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);

        assertEq(id, 1);
        assertEq(registry.totalIssued(), 1);

        (CertificateRegistry.Certificate memory cert, bool valid) = registry.getCertificate(id);
        assertTrue(valid);
        assertEq(cert.student, student);
        assertEq(cert.issuer, issuer);
        assertEq(cert.issuedAt, uint64(1_700_000_000));
        assertEq(cert.revokedAt, 0);
        assertEq(cert.courseId, COURSE_A);
        assertEq(cert.documentHash, HASH_A);
    }

    function test_issue_revertsZeroStudent() public {
        vm.expectRevert(CertificateRegistry.ZeroAddress.selector);
        _issue(issuer, address(0), COURSE_A, HASH_A);
    }

    function test_issue_revertsEmptyDocumentHash() public {
        vm.expectRevert(CertificateRegistry.EmptyDocumentHash.selector);
        _issue(issuer, student, COURSE_A, bytes32(0));
    }

    function test_issue_revertsAlreadyCertified() public {
        _issue(issuer, student, COURSE_A, HASH_A);

        vm.expectRevert(abi.encodeWithSelector(CertificateRegistry.AlreadyCertified.selector, student, COURSE_A));
        _issue(otherIssuer, student, COURSE_A, HASH_B);
    }

    function test_issue_sameStudentOtherCourse() public {
        uint256 first = _issue(issuer, student, COURSE_A, HASH_A);
        uint256 second = _issue(issuer, student, COURSE_B, HASH_B);

        assertEq(first, 1);
        assertEq(second, 2);
        assertEq(registry.totalIssued(), 2);
        assertTrue(registry.verify(first, HASH_A));
        assertTrue(registry.verify(second, HASH_B));
    }

    function test_issue_afterRevokeGivesNewId() public {
        uint256 first = _issue(issuer, student, COURSE_A, HASH_A);
        vm.prank(issuer);
        registry.revokeCertificate(first);

        uint256 second = _issue(issuer, student, COURSE_A, HASH_B);

        assertEq(second, 2);
        assertEq(registry.totalIssued(), 2);
        assertFalse(registry.verify(first, HASH_A));
        assertTrue(registry.verify(second, HASH_B));
    }

    function test_issue_revertsWithoutRole() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, ISSUER_ROLE
            )
        );
        _issue(stranger, student, COURSE_A, HASH_A);
    }

    function test_issue_adminWithoutIssuerRoleReverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, admin, ISSUER_ROLE
            )
        );
        _issue(admin, student, COURSE_A, HASH_A);
    }

    function test_issue_idsAreSequential() public {
        address s2 = makeAddr("student2");
        address s3 = makeAddr("student3");

        assertEq(_issue(issuer, student, COURSE_A, HASH_A), 1);
        assertEq(_issue(issuer, s2, COURSE_A, HASH_A), 2);
        assertEq(_issue(otherIssuer, s3, COURSE_A, HASH_A), 3);
        assertEq(registry.totalIssued(), 3);
    }

    // ---------------------------------------------------------------- revoke

    function test_revoke_byAdmin() public {
        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);
        vm.warp(1_800_000_000);

        vm.expectEmit(true, true, false, false, address(registry));
        emit CertificateRevoked(id, admin);

        vm.prank(admin);
        registry.revokeCertificate(id);

        (CertificateRegistry.Certificate memory cert, bool valid) = registry.getCertificate(id);
        assertFalse(valid);
        assertEq(cert.revokedAt, uint64(1_800_000_000));
        assertEq(cert.student, student);
        assertEq(cert.documentHash, HASH_A);
    }

    function test_revoke_byOriginalIssuer() public {
        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);

        vm.expectEmit(true, true, false, false, address(registry));
        emit CertificateRevoked(id, issuer);

        vm.prank(issuer);
        registry.revokeCertificate(id);

        (, bool valid) = registry.getCertificate(id);
        assertFalse(valid);
    }

    function test_revoke_revertsOtherIssuer() public {
        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);

        vm.expectRevert(abi.encodeWithSelector(CertificateRegistry.NotAllowedToRevoke.selector, id, otherIssuer));
        vm.prank(otherIssuer);
        registry.revokeCertificate(id);
    }

    function test_revoke_revertsOriginalIssuerWithoutRole() public {
        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);

        vm.prank(admin);
        registry.revokeRole(ISSUER_ROLE, issuer);

        vm.expectRevert(abi.encodeWithSelector(CertificateRegistry.NotAllowedToRevoke.selector, id, issuer));
        vm.prank(issuer);
        registry.revokeCertificate(id);
    }

    function test_revoke_revertsStranger() public {
        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);

        vm.expectRevert(abi.encodeWithSelector(CertificateRegistry.NotAllowedToRevoke.selector, id, stranger));
        vm.prank(stranger);
        registry.revokeCertificate(id);
    }

    function test_revoke_revertsAlreadyRevoked() public {
        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);
        vm.prank(admin);
        registry.revokeCertificate(id);

        vm.expectRevert(abi.encodeWithSelector(CertificateRegistry.AlreadyRevoked.selector, id));
        vm.prank(admin);
        registry.revokeCertificate(id);
    }

    function test_revoke_revertsNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(CertificateRegistry.CertificateNotFound.selector, 0));
        vm.prank(admin);
        registry.revokeCertificate(0);

        vm.expectRevert(abi.encodeWithSelector(CertificateRegistry.CertificateNotFound.selector, 99));
        vm.prank(admin);
        registry.revokeCertificate(99);
    }

    function test_revoke_doesNotDecreaseTotalIssued() public {
        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);
        assertEq(registry.totalIssued(), 1);

        vm.prank(admin);
        registry.revokeCertificate(id);
        assertEq(registry.totalIssued(), 1);
    }

    // ---------------------------------------------------------------- getCertificate

    function test_getCertificate_revertsNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(CertificateRegistry.CertificateNotFound.selector, 0));
        registry.getCertificate(0);

        vm.expectRevert(abi.encodeWithSelector(CertificateRegistry.CertificateNotFound.selector, 99));
        registry.getCertificate(99);
    }

    // ---------------------------------------------------------------- verify

    function test_verify_trueForValid() public {
        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);
        assertTrue(registry.verify(id, HASH_A));
    }

    function test_verify_falseForWrongHash() public {
        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);
        assertFalse(registry.verify(id, HASH_B));
    }

    function test_verify_falseForRevoked() public {
        uint256 id = _issue(issuer, student, COURSE_A, HASH_A);
        vm.prank(admin);
        registry.revokeCertificate(id);
        assertFalse(registry.verify(id, HASH_A));
    }

    function test_verify_falseForNonexistentNoRevert() public view {
        assertFalse(registry.verify(0, HASH_A));
        assertFalse(registry.verify(99, HASH_A));
    }

    // ---------------------------------------------------------------- roles

    function test_grantRole_revertsNonAdmin() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, DEFAULT_ADMIN_ROLE
            )
        );
        vm.prank(stranger);
        registry.grantRole(ISSUER_ROLE, stranger);
    }

    function test_grantRole_issuerCannotGrant() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, issuer, DEFAULT_ADMIN_ROLE
            )
        );
        vm.prank(issuer);
        registry.grantRole(ISSUER_ROLE, stranger);
    }
}
