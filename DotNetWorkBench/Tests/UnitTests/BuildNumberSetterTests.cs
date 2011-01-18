namespace UnitTests
{
    using BuildTasks;

    using NUnit.Framework;

    [TestFixture]
    public class BuildNumberSetterTests
    {
        [Test]
        public void Integration()
        {
            var sut = new SetBuildNumber();
            sut.Path = @"c:\temp\";
            sut.Filename = @"testv*.txt";
            sut.BuildNumberRegExPattern = @"(\d+\.\d+)\.(\d+)";
            sut.BuildNumber = 123;

            sut.Execute();
        }
    }
}