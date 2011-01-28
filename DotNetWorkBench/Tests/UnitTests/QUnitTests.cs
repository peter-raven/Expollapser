namespace UnitTests
{
    using System;
    using System.Diagnostics;
    using System.Threading;

    using NUnit.Framework;

    [TestFixture]
    public class QUnitTests : JavaScriptUnitTestBase
    {
        public QUnitTests()
            : base(new SeleniumQUnitTestRunner(), new QUnitTestResultsParser())
        {
        }

        public override string[] QUnitTestUrls
        {
            get
            {
                return new[] { @"http://localhost:8444/Fixture.htm" };
            }
        }
    }
}