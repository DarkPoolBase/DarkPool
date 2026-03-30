// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ComputeCredit.sol";

contract ComputeCreditTest is Test {
    ComputeCredit public credit;
    address public admin = address(this);
    address public minter = address(0xA1);
    address public darkPool = address(0xA2);
    address public user = address(0xBEEF);

    function setUp() public {
        credit = new ComputeCredit();
        credit.grantRole(credit.MINTER_ROLE(), minter);
        credit.grantRole(credit.DARKPOOL_ROLE(), darkPool);
    }

    // ========== Token Metadata ==========

    function test_Name() public view {
        assertEq(credit.name(), "ADP Compute Credit");
    }

    function test_Symbol() public view {
        assertEq(credit.symbol(), "ADPC");
    }

    function test_Decimals() public view {
        assertEq(credit.decimals(), 18);
    }

    // ========== Minting ==========

    function test_MintByMinter() public {
        vm.prank(minter);
        credit.mint(user, 100e18);
        assertEq(credit.balanceOf(user), 100e18);
    }

    function test_RevertMintByNonMinter() public {
        vm.prank(user);
        vm.expectRevert();
        credit.mint(user, 100e18);
    }

    function test_RevertMintToZeroAddress() public {
        vm.prank(minter);
        vm.expectRevert("ComputeCredit: mint to zero address");
        credit.mint(address(0), 100e18);
    }

    function test_RevertMintZeroAmount() public {
        vm.prank(minter);
        vm.expectRevert("ComputeCredit: zero amount");
        credit.mint(user, 0);
    }

    function test_EmitCreditsMinted() public {
        vm.prank(minter);
        vm.expectEmit(true, false, false, true);
        emit IComputeCredit.CreditsMinted(user, 100e18, 0);
        credit.mint(user, 100e18);
    }

    // ========== Burning ==========

    function test_BurnByDarkPool() public {
        vm.prank(minter);
        credit.mint(user, 100e18);

        vm.prank(darkPool);
        credit.burn(user, 40e18);

        assertEq(credit.balanceOf(user), 60e18);
    }

    function test_RevertBurnByNonDarkPool() public {
        vm.prank(minter);
        credit.mint(user, 100e18);

        vm.prank(user);
        vm.expectRevert();
        credit.burn(user, 40e18);
    }

    function test_RevertBurnZeroAmount() public {
        vm.prank(darkPool);
        vm.expectRevert("ComputeCredit: zero amount");
        credit.burn(user, 0);
    }

    function test_RevertBurnInsufficientBalance() public {
        vm.prank(darkPool);
        vm.expectRevert("ComputeCredit: insufficient balance");
        credit.burn(user, 100e18);
    }

    function test_EmitCreditsBurned() public {
        vm.prank(minter);
        credit.mint(user, 100e18);

        vm.prank(darkPool);
        vm.expectEmit(true, false, false, true);
        emit IComputeCredit.CreditsBurned(user, 40e18);
        credit.burn(user, 40e18);
    }

    // ========== Exchange Rate ==========

    function test_DefaultExchangeRate() public view {
        assertEq(credit.exchangeRate(), 1e18);
    }

    function test_SetExchangeRate() public {
        credit.setExchangeRate(2e18);
        assertEq(credit.exchangeRate(), 2e18);
    }

    function test_RevertSetExchangeRateZero() public {
        vm.expectRevert("ComputeCredit: zero exchange rate");
        credit.setExchangeRate(0);
    }

    function test_RevertSetExchangeRateUnauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        credit.setExchangeRate(2e18);
    }

    function test_EmitExchangeRateUpdated() public {
        vm.expectEmit(false, false, false, true);
        emit IComputeCredit.ExchangeRateUpdated(1e18, 2e18);
        credit.setExchangeRate(2e18);
    }

    // ========== Pausable ==========

    function test_MintRevertsWhenPaused() public {
        credit.pause();
        vm.prank(minter);
        vm.expectRevert();
        credit.mint(user, 100e18);
    }

    function test_MintWorksAfterUnpause() public {
        credit.pause();
        credit.unpause();
        vm.prank(minter);
        credit.mint(user, 100e18);
        assertEq(credit.balanceOf(user), 100e18);
    }

    // ========== ERC-20 Compliance ==========

    function test_Transfer() public {
        vm.prank(minter);
        credit.mint(user, 100e18);

        vm.prank(user);
        credit.transfer(address(0xCAFE), 30e18);

        assertEq(credit.balanceOf(user), 70e18);
        assertEq(credit.balanceOf(address(0xCAFE)), 30e18);
    }

    function test_ApproveAndTransferFrom() public {
        vm.prank(minter);
        credit.mint(user, 100e18);

        vm.prank(user);
        credit.approve(address(0xCAFE), 50e18);

        vm.prank(address(0xCAFE));
        credit.transferFrom(user, address(0xDEAD), 50e18);

        assertEq(credit.balanceOf(user), 50e18);
        assertEq(credit.balanceOf(address(0xDEAD)), 50e18);
    }

    // ========== Fuzz ==========

    function testFuzz_MintAndBurn(uint256 mintAmount, uint256 burnAmount) public {
        vm.assume(mintAmount > 0 && mintAmount < type(uint128).max);
        vm.assume(burnAmount > 0 && burnAmount <= mintAmount);

        vm.prank(minter);
        credit.mint(user, mintAmount);

        vm.prank(darkPool);
        credit.burn(user, burnAmount);

        assertEq(credit.balanceOf(user), mintAmount - burnAmount);
    }
}
